import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from 'src/shared/events/event-handler.decorator';
import { EventType } from 'src/shared/events/event-types';
import {
  MonitorStatus,
  IncidentStatus,
  IncidentSeverity,
  IncidentEventType,
} from '@prisma/client';
import { type EventMessage } from '@/infrastructure/outbox/types/outbox.types';
import { OutboxRepository } from '@/infrastructure/outbox/repositories/outbox.repository';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { AggregateType } from '@prisma/client';
import { PRISMA_TRANSACTION_TIMEOUT, PrismaTransactionType } from '@/constants';
import { randomUUID } from 'crypto';

const INCIDENT_FAILURE_THRESHOLD = 3; // Number of consecutive failures before creating incident

interface MonitorStatusChangedPayload {
  monitorId: string;
  organizationId: string;
  previousStatus: MonitorStatus;
  newStatus: MonitorStatus;
  checkedAt: string;
}

interface IncidentCreatedPayload {
  incidentId: string;
  monitorId: string;
  organizationId: string;
  startedAt: string;
}

interface IncidentResolvedPayload {
  incidentId: string;
  monitorId: string;
  organizationId: string;
  resolvedAt: string;
}

@Injectable()
export class IncidentConsumer {
  private readonly logger = new Logger(IncidentConsumer.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly prisma: PrismaService,
    private readonly outboxWriter: OutboxWriter,
  ) {}

  @EventHandler(EventType.MONITOR_STATUS_CHANGED)
  async handleMonitorStatusChanged(message: EventMessage): Promise<void> {
    const claimed = await this.outboxRepository.tryClaimProcessing(
      message.idempotencyKey,
    );
    if (!claimed) {
      this.logger.debug(
        `Monitor status changed event already claimed/processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: MonitorStatusChangedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor status changed event received: ${payload.monitorId} from ${payload.previousStatus} to ${payload.newStatus}`,
    );

    const checkedAt = new Date(payload.checkedAt);

    if (payload.newStatus === MonitorStatus.DOWN) {
      await this.handleMonitorDown(
        payload.monitorId,
        payload.organizationId,
        checkedAt,
      );
    } else if (
      (payload.previousStatus === MonitorStatus.DOWN ||
        payload.previousStatus === MonitorStatus.PENDING) &&
      payload.newStatus === MonitorStatus.UP
    ) {
      await this.handleMonitorUp(payload.monitorId, checkedAt);
    }

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  private async handleMonitorDown(
    monitorId: string,
    organizationId: string,
    checkedAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // Coalesce null → 0 before incrementing so $inc never receives a null
        // field (MongoDB throws "cannot increment with non-numeric argument" if it does).
        await tx.$runCommandRaw({
          update: 'monitors',
          updates: [
            {
              q: { _id: { $oid: monitorId }, consecutiveFailures: null },
              u: { $set: { consecutiveFailures: 0 } },
              multi: false,
            },
          ],
        });

        // Increment consecutive failures counter atomically
        const monitor = await tx.monitor.update({
          where: { id: monitorId },
          data: {
            consecutiveFailures: {
              increment: 1,
            },
          },
          select: {
            consecutiveFailures: true,
          },
        });

        const currentFailures = monitor.consecutiveFailures;

        this.logger.log(
          `Monitor ${monitorId} failure count: ${currentFailures}/${INCIDENT_FAILURE_THRESHOLD}`,
        );

        // Only create incident after threshold is reached
        if (currentFailures >= INCIDENT_FAILURE_THRESHOLD) {
          // CAS (Compare-And-Swap) gate: atomically claim the right to
          // create an incident by flipping hasOpenIncident false -> true.
          // This prevents two concurrent handleMonitorDown calls from
          // both passing a read-then-write check and creating duplicates.
          // If result.count === 0, someone else won the race or there
          // already is an open incident — we bail out in either case.
          const claimResult = await tx.monitor.updateMany({
            where: {
              id: monitorId,
              hasOpenIncident: false,
            },
            data: {
              hasOpenIncident: true,
            },
          });

          if (claimResult.count === 0) {
            this.logger.log(
              `Open incident already claimed/exists for monitor ${monitorId}; skipping duplicate creation`,
            );
            return;
          }

          // Generate public ID with collision handling
          const publicId = await this.generatePublicIdWithRetry(tx);

          // Create incident with lifecycle fields
          const incident = await tx.incident.create({
            data: {
              monitorId,
              organizationId,
              publicId,
              title: `Monitor ${monitorId} is down`,
              status: IncidentStatus.INVESTIGATING,
              severity: IncidentSeverity.MAJOR,
              detectedAt: checkedAt,
              summary: `Monitor has failed ${currentFailures} consecutive checks`,
              publicMessage: 'We are investigating an issue with this monitor',
            },
          });

          // Create initial incident event
          await tx.incidentEvent.create({
            data: {
              incidentId: incident.id,
              type: IncidentEventType.STATUS_UPDATE,
              status: IncidentStatus.INVESTIGATING,
              message: 'Incident created due to consecutive monitor failures',
            },
          });

          // Emit incident created event
          await this.outboxWriter.writeTx(tx, {
            aggregateType: AggregateType.Incident,
            idempotencyKey: `incident-created-${incident.id}`,
            aggregateId: incident.id,
            eventType: EventType.INCIDENT_CREATED,
            payload: {
              incidentId: incident.id,
              monitorId,
              organizationId,
              startedAt: checkedAt.toISOString(),
            },
          });

          this.logger.log(
            `Incident ${incident.id} created for monitor ${monitorId} after ${currentFailures} failures`,
          );
        }
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );
  }

  private async handleMonitorUp(
    monitorId: string,
    checkedAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // Reset consecutive failures counter on successful check
        await tx.monitor.update({
          where: { id: monitorId },
          data: {
            consecutiveFailures: 0,
          },
        });

        const activeIncident = await tx.incident.findFirst({
          where: {
            monitorId,
            resolvedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            status: true,
            detectedAt: true,
            organizationId: true,
          },
        });

        this.logger.log(
          `Active incident for monitor ${monitorId}: ${activeIncident?.id}`,
        );

        if (activeIncident) {
          // Validate state transition
          if (
            !this.canTransitionTo(
              activeIncident.status as IncidentStatus,
              IncidentStatus.RESOLVED,
            )
          ) {
            this.logger.warn(
              `Invalid state transition from ${activeIncident.status} to RESOLVED for incident ${activeIncident.id}`,
            );
            return;
          }

          const durationMs =
            checkedAt.getTime() - activeIncident.detectedAt.getTime();

          await tx.incident.update({
            where: { id: activeIncident.id },
            data: {
              status: IncidentStatus.RESOLVED,
              resolvedAt: checkedAt,
              durationMs,
            },
          });

          // Reset the CAS gate so future down->up cycles can create new incidents
          await tx.monitor.update({
            where: { id: monitorId },
            data: {
              hasOpenIncident: false,
            },
          });

          // Create resolution event
          await tx.incidentEvent.create({
            data: {
              incidentId: activeIncident.id,
              type: IncidentEventType.STATUS_UPDATE,
              status: IncidentStatus.RESOLVED,
              message: 'Incident resolved - monitor is back up',
            },
          });

          this.logger.log(
            `Found active incident for monitor ${monitorId}: ${activeIncident.id}`,
          );

          await this.outboxWriter.writeTx(tx, {
            aggregateType: AggregateType.Incident,
            idempotencyKey: `incident-resolved-${activeIncident.id}`,
            aggregateId: activeIncident.id,
            eventType: EventType.INCIDENT_RESOLVED,
            payload: {
              incidentId: activeIncident.id,
              monitorId: monitorId,
              organizationId: activeIncident.organizationId,
              resolvedAt: checkedAt.toISOString(),
            },
          });

          this.logger.log(
            `Incident ${activeIncident.id} resolved for monitor ${monitorId}`,
          );
        }
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT },
    );
  }

  private async generatePublicIdWithRetry(
    tx: PrismaTransactionType,
  ): Promise<string> {
    const MAX_RETRIES = 10;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const uuid = randomUUID();

      try {
        const existing = await tx.incident.findUnique({
          where: { publicId: uuid },
          select: { id: true },
        });

        if (!existing) {
          return uuid;
        }

        this.logger.warn(
          `Public ID collision on attempt ${attempt + 1}; retrying...`,
        );
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === 'P2002'
        ) {
          this.logger.warn(
            `Public ID unique constraint violation on attempt ${attempt + 1}; retrying...`,
          );
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Failed to generate unique public ID after ${MAX_RETRIES} attempts`,
    );
  }

  @EventHandler(EventType.INCIDENT_CREATED)
  async handleIncidentCreated(message: EventMessage): Promise<void> {
    const claimed = await this.outboxRepository.tryClaimProcessing(
      message.idempotencyKey,
    );
    if (!claimed) {
      this.logger.debug(
        `Incident created event already claimed/processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: IncidentCreatedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Incident created event received: ${payload.incidentId} for monitor ${payload.monitorId}`,
    );

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  @EventHandler(EventType.INCIDENT_RESOLVED)
  async handleIncidentResolved(message: EventMessage): Promise<void> {
    const claimed = await this.outboxRepository.tryClaimProcessing(
      message.idempotencyKey,
    );
    if (!claimed) {
      this.logger.debug(
        `Incident resolved event already claimed/processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: IncidentResolvedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Incident resolved event received: ${payload.incidentId} for monitor ${payload.monitorId}`,
    );

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }

  private canTransitionTo(
    currentStatus: IncidentStatus,
    newStatus: IncidentStatus,
  ): boolean {
    const validTransitions: Record<string, IncidentStatus[]> = {
      [IncidentStatus.INVESTIGATING]: [
        IncidentStatus.IDENTIFIED,
        IncidentStatus.MONITORING,
        IncidentStatus.RESOLVED,
      ],
      [IncidentStatus.IDENTIFIED]: [
        IncidentStatus.MONITORING,
        IncidentStatus.RESOLVED,
      ],
      [IncidentStatus.MONITORING]: [
        IncidentStatus.INVESTIGATING,
        IncidentStatus.IDENTIFIED,
        IncidentStatus.RESOLVED,
      ],
      [IncidentStatus.RESOLVED]: [], // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

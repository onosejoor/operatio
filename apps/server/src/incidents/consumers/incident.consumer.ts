import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from 'src/shared/events/event-handler.decorator';
import { EventType } from 'src/shared/events/event-types';
import { MonitorStatus } from '@prisma/client';
import { type EventMessage } from '@/infrastructure/outbox/types/outbox.types';
import { OutboxRepository } from '@/infrastructure/outbox/repositories/outbox.repository';
import { PrismaService } from '../../database/database.service';
import { OutboxWriter } from '../../infrastructure/outbox/writers/outbox.writer';
import { AggregateType } from '@prisma/client';

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
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Monitor status changed event already processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: MonitorStatusChangedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Monitor status changed event received: ${payload.monitorId} from ${payload.previousStatus} to ${payload.newStatus}`,
    );

    const checkedAt = new Date(payload.checkedAt);

    if (
      payload.previousStatus === MonitorStatus.UP &&
      payload.newStatus === MonitorStatus.DOWN
    ) {
      await this.handleMonitorDown(
        payload.monitorId,
        payload.organizationId,
        checkedAt,
      );
    } else if (
      payload.previousStatus === MonitorStatus.DOWN &&
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
    const incident = await this.prisma.incident.create({
      data: {
        monitorId,
        organizationId,
        startedAt: checkedAt,
      },
    });

    await this.outboxWriter.write({
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

    this.logger.log(`Incident created for monitor ${monitorId}`);
  }

  private async handleMonitorUp(
    monitorId: string,
    checkedAt: Date,
  ): Promise<void> {
    const activeIncident = await this.prisma.incident.findFirst({
      where: {
        monitorId,
        resolvedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (activeIncident) {
      await this.prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          resolvedAt: checkedAt,
        },
      });

      await this.outboxWriter.write({
        aggregateType: AggregateType.Incident,
        idempotencyKey: `incident-resolved-${activeIncident.id}`,
        aggregateId: activeIncident.id,
        eventType: EventType.INCIDENT_RESOLVED,
        payload: {
          incidentId: activeIncident.id,
          monitorId: activeIncident.monitorId,
          organizationId: activeIncident.organizationId,
          resolvedAt: checkedAt.toISOString(),
        },
      });

      this.logger.log(
        `Incident ${activeIncident.id} resolved for monitor ${monitorId}`,
      );
    }
  }

  @EventHandler(EventType.INCIDENT_CREATED)
  async handleIncidentCreated(message: EventMessage): Promise<void> {
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Incident created event already processed: ${message.idempotencyKey}`,
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
    const done = await this.outboxRepository.isProcessed(
      message.idempotencyKey,
    );
    if (done) {
      this.logger.debug(
        `Incident resolved event already processed: ${message.idempotencyKey}`,
      );
      return;
    }

    const payload: IncidentResolvedPayload = JSON.parse(message.payload);
    this.logger.log(
      `Incident resolved event received: ${payload.incidentId} for monitor ${payload.monitorId}`,
    );

    await this.outboxRepository.markProcessedByKey(message.idempotencyKey);
  }
}

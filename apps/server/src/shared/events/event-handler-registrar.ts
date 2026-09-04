import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { 
  DiscoveryService, 
  MetadataScanner, 
  Reflector,
} from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventDispatcher } from '../../infrastructure/outbox/dispatchers/event-dispatcher';
import { EventHandler } from './event-handler.interface';
import { EVENT_HANDLER_METADATA } from './event-handler.decorator';

@Injectable()
export class EventHandlerRegistrar implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventHandlerRegistrar.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  onApplicationBootstrap(): void {
    this.logger.log('Starting event handler registration...');

    const providers: InstanceWrapper[] = this.discoveryService.getProviders();
    let totalHandlersRegistered = 0;

    for (const provider of providers) {
      if (!provider.metatype || !provider.instance) {
        continue;
      }

      const instance = provider.instance;
      const prototype = Object.getPrototypeOf(instance);

      if (!prototype) {
        continue;
      }

      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const method = instance[methodName];
        
        if (typeof method !== 'function') {
          continue;
        }

        const eventType = this.reflector.get<string>(
          EVENT_HANDLER_METADATA,
          method,
        );

        if (!eventType) {
          continue;
        }

        // Bind the method to the instance and register it
        const boundMethod = method.bind(instance);
        
        // Create an EventHandler-compatible wrapper
        const handler: EventHandler = {
          handle: async (payload: unknown) => {
            await boundMethod(payload);
          },
        };

        this.eventDispatcher.register(eventType, handler);
        totalHandlersRegistered++;

        this.logger.log(
          `Registered handler: ${provider.metatype.name}.${methodName} for event type: ${eventType}`,
        );
      }
    }

    this.logger.log(
      `Event handler registration completed. Total handlers registered: ${totalHandlersRegistered}`,
    );

    if (totalHandlersRegistered === 0) {
      this.logger.warn('No event handlers were registered.');
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import {
  EventDispatcher
import { EventHandler } from '../../shared/events/event-handler.interface';

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventDispatcher],
    }).compile();

    dispatcher = module.get<EventDispatcher>(EventDispatcher);
  });

  describe('register', () => {
    it('should register a handler for an event type', () => {
      const mockHandler: EventHandler = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register('test.event', mockHandler);

      expect(dispatcher['handlers'].has('test.event')).toBe(true);
    });
  });

  describe('dispatch', () => {
    it('should dispatch event to registered handler', async () => {
      const mockHandler: EventHandler = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register('test.event', mockHandler);

      const payload = { data: 'test' };
      await dispatcher.dispatch('test.event', payload);

      expect(mockHandler.handle).toHaveBeenCalledWith(payload);
    });

    it('should throw error when no handler is registered', async () => {
      await expect(
        dispatcher.dispatch('nonexistent.event', {}),
      ).rejects.toThrow('No handler registered for event type: nonexistent.event');
    });

    it('should handle handler errors', async () => {
      const mockHandler: EventHandler = {
        handle: jest.fn().mockRejectedValue(new Error('Handler failed')),
      };

      dispatcher.register('failing.event', mockHandler);

      await expect(dispatcher.dispatch('failing.event', {})).rejects.toThrow(
        'Handler failed',
      );
    });
  });

  describe('hasHandler', () => {
    it('should return true when handler is registered', () => {
      const mockHandler: EventHandler = {
        handle: jest.fn().mockResolvedValue(undefined),
      };

      dispatcher.register('test.event', mockHandler);

      expect(dispatcher.hasHandler('test.event')).toBe(true);
    });

    it('should return false when handler is not registered', () => {
      expect(dispatcher.hasHandler('nonexistent.event')).toBe(false);
    });
  });
});

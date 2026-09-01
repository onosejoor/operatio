export interface EventHandler<TPayload = unknown> {
  handle(payload: TPayload): Promise<void>;
}

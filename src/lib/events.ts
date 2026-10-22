type Listener = (data: string) => void;

class RealtimeEventBus {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(event: string, payload: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const listener of this.listeners) {
      try {
        listener(message);
      } catch (err) {
        console.error("Error dispatching SSE event", err);
      }
    }
  }

  public get listenerCount(): number {
    return this.listeners.size;
  }
}

// Global singleton to persist across Next.js API reloads
declare global {
  // eslint-disable-next-line no-var
  var eventBus: RealtimeEventBus | undefined;
}

export const realtimeBus = global.eventBus || new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  global.eventBus = realtimeBus;
}

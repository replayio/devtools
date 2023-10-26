export type EventMap = {
  [key: string]: (...args: any[]) => void;
};

export class EventEmitter<Events extends EventMap> {
  private listenerMap: Map<keyof Events, Array<Events[keyof Events]>> = new Map();

  addListener<Type extends keyof Events>(type: Type, listener: Events[Type]) {
    const listeners = this.listenerMap.get(type);
    if (listeners === undefined) {
      this.listenerMap.set(type, [listener]);
    } else {
      if (!listeners.includes(listener)) {
        listeners.push(listener);
      }
    }

    return () => {
      this.removeListener(type, listener);
    };
  }

  emit<Type extends keyof Events>(event: Type, ...args: Parameters<Events[Type]>) {
    const listeners = this.listenerMap.get(event);
    if (listeners !== undefined) {
      if (listeners.length === 1) {
        const listener = listeners[0];
        listener.apply(null, args);
      } else {
        let didThrow = false;
        let caughtError = null;

        // Clone the current listeners before calling
        // in case calling triggers listeners to be added or removed
        const clonedListeners = Array.from(listeners);
        for (let i = 0; i < clonedListeners.length; i++) {
          const listener = clonedListeners[i];
          try {
            listener.apply(null, args);
          } catch (error) {
            if (caughtError === null) {
              didThrow = true;
              caughtError = error;
            }
          }
        }

        if (didThrow) {
          throw caughtError;
        }
      }
    }
  }

  removeAllListeners<Type extends keyof Events>(event?: Type) {
    this.listenerMap.clear();
  }

  removeListener<Type extends keyof Events>(event: Type, listener: Events[Type]) {
    const listeners = this.listenerMap.get(event);
    if (listeners !== undefined) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  }
}

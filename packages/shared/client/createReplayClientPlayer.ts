import { ReplayClientInterface } from "shared/client/types";
import { ReplayClientEvents } from "shared/client/types";
import createPlayer from "shared/proxy/createPlayer";
import { Entry } from "shared/proxy/types";

export default function createReplayClientPlayer(entries: Entry[]): ReplayClientInterface {
  const eventHandlers: Map<ReplayClientEvents, Function[]> = new Map();

  return createPlayer<ReplayClientInterface>(entries, {
    addEventListener: (type: ReplayClientEvents, handler: Function) => {
      if (!eventHandlers.has(type)) {
        eventHandlers.set(type, []);
      }

      const handlers = eventHandlers.get(type)!;
      handlers.push(handler);

      entries.forEach(entry => {
        if (entry.prop === "dispatchEvent") {
          const args = entry.args as any[];
          if (args[0] === type) {
            handler(...args.slice(1));
          }
        }
      });
    },
    removeEventListener: (type: ReplayClientEvents, handler: Function) => {
      if (eventHandlers.has(type)) {
        const handlers = eventHandlers.get(type)!;
        const index = handlers.indexOf(handler);
        if (index >= 0) {
          handlers.splice(index, 1);
        }
      }
    },
  });
}

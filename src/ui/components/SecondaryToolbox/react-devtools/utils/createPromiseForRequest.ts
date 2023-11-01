import { BackendEvents, FrontendBridge } from "@replayio/react-devtools-inline";

const TIMEOUT_DELAY = 15_000;

export function createPromiseForRequest<Value>(
  requestID: number,
  eventType: keyof BackendEvents,
  bridge: FrontendBridge,
  timeoutMessage: string = `Timed out waiting for response to "${eventType}" message`
): Promise<Value> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      bridge.removeListener(eventType, onEvent);

      clearTimeout(timeoutID);
    };

    const onEvent = (data: any) => {
      if (data.responseID === requestID) {
        cleanup();
        resolve(data as Value);
      }
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error(timeoutMessage));
    };

    bridge.addListener(eventType, onEvent);

    const timeoutID = setTimeout(onTimeout, TIMEOUT_DELAY);
  });
}

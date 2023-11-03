import { BackendEvents, FrontendBridge } from "@replayio/react-devtools-inline";

export function createPromiseForRequest<Value>({
  bridge,
  eventType,
  requestID,
  timeoutDelay,
  timeoutMessage = `Timed out waiting for response to "${eventType}" message`,
}: {
  bridge: FrontendBridge;
  eventType: keyof BackendEvents;
  requestID: number;
  timeoutDelay: number;
  timeoutMessage?: string;
}): Promise<Value> {
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

    const timeoutID = setTimeout(onTimeout, timeoutDelay);
  });
}

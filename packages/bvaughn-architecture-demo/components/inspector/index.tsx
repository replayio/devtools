import { ExecutionPoint, PauseId, Value as ProtocolValue } from "@replayio/protocol";

import KeyValueRenderer from "./KeyValueRenderer";

export default function Inspector({
  executionPoint,
  pauseId,
  protocolValue,
}: {
  executionPoint: ExecutionPoint;
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  return (
    <KeyValueRenderer
      executionPoint={executionPoint}
      isNested={false}
      layout="horizontal"
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );
}

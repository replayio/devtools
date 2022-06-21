import { PauseId, Value as ProtocolValue } from "@replayio/protocol";

import KeyValueRenderer from "./KeyValueRenderer";

export default function Inspector({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  return (
    <KeyValueRenderer
      isNested={false}
      layout="horizontal"
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );
}

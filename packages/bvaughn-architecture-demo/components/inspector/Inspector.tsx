import { PauseId, Value as ProtocolValue } from "@replayio/protocol";

import styles from "./Inspector.module.css";
import KeyValueRenderer from "./KeyValueRenderer";

export default function Inspector({
  className,
  context,
  pauseId,
  protocolValue,
}: {
  className?: string;
  context: "console" | "default";
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const keyValue = (
    <KeyValueRenderer
      context={context}
      layout="horizontal"
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );

  if (context === "console") {
    return keyValue;
  } else {
    return (
      <div className={`${styles.Inspector} ${className || ""}`} data-test-id="InspectorRoot">
        {keyValue}
      </div>
    );
  }
}

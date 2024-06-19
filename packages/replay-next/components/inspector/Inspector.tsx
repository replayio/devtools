import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import KeyValueRenderer from "./KeyValueRendererWithContextMenu";
import styles from "./Inspector.module.css";

export default function Inspector({
  className,
  context,
  path,
  pauseId,
  protocolValue,
  expandByDefault,
}: {
  className?: string;
  context: "console" | "default";
  path?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
  expandByDefault?: boolean;
}) {
  const keyValue = (
    <KeyValueRenderer
      context={context}
      expandByDefault={expandByDefault}
      layout="horizontal"
      path={path}
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );

  if (context === "console") {
    return keyValue;
  } else {
    return (
      <div className={`${styles.Inspector} ${className || ""}`} data-test-name="InspectorRoot">
        {keyValue}
      </div>
    );
  }
}

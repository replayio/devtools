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
  expandByDefault,
  path,
  pauseId,
  protocolValue,
}: {
  className?: string;
  context: "console" | "default";
  expandByDefault?: boolean;
  path?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
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

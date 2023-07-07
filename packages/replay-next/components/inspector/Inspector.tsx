import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import KeyValueRenderer from "./KeyValueRendererWithContextMenu";
import styles from "./Inspector.module.css";

declare global {
  var rendered: Map<string, number> | undefined;
  var totalRendered: number | undefined;
}
if (typeof window !== "undefined") {
  window.rendered = new Map();
}

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
  if (window.rendered && "name" in protocolValue) {
    const name = `${protocolValue.name} - ${protocolValue.object}`;
    window.rendered.set(name, (window.rendered.get(name) ?? 0) + 1);
    window.totalRendered = (window.totalRendered ?? 0) + 1;
  }

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

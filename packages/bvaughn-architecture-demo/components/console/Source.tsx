import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { Location as ProtocolLocation } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./Source.module.css";

export default function Source({
  className = "",
  location,
}: {
  className?: string;
  location: ProtocolLocation;
}) {
  const { inspectFunctionDefinition } = useContext(InspectorContext);
  const client = useContext(ReplayClientContext);
  const source = getSource(client, location.sourceId);
  if (source == null) {
    return null;
  }

  const fileName = source.url?.split("/").slice(-1)[0];

  const openSource = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (inspectFunctionDefinition !== null) {
      inspectFunctionDefinition([location]);
    }
  };

  return (
    <span className={`${styles.Source} ${className}`} onClick={openSource}>
      {fileName}:{location.line}
    </span>
  );
}

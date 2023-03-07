import { Location as ProtocolLocation } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";

import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { sourceCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./Source.module.css";

export default function Source({
  className = "",
  locations,
}: {
  className?: string;
  locations: ProtocolLocation[];
}) {
  const { inspectFunctionDefinition } = useContext(InspectorContext);
  const client = useContext(ReplayClientContext);

  const location = client.getPreferredLocation(locations);
  if (location == null) {
    return null;
  }

  const source = sourceCache.read(client, location.sourceId);
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

  const sourceString = `${fileName}:${location.line}`;

  return (
    <span
      className={`${styles.Source} ${className}`}
      data-test-name="Console-Source"
      onClick={openSource}
      title={sourceString}
    >
      {sourceString}
    </span>
  );
}

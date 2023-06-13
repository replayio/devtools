import { MappedLocation, Location as ProtocolLocation, SourceId } from "@replayio/protocol";
import { MouseEvent, useContext, useMemo } from "react";

import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getSourceSuspends, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { Source as SourceType } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocationWorkaround } from "replay-next/src/utils/sources";
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
  const { trackEvent } = useContext(SessionContext);
  const { preferredGeneratedSourceIds } = useContext(SourcesContext);

  const sourcesById = sourcesByIdCache.read(client);
  const location = getPreferredLocationWorkaround(
    sourcesById,
    preferredGeneratedSourceIds,
    locations
  );
  if (location == null) {
    return null;
  }

  const source = getSourceSuspends(client, location.sourceId);
  if (source == null) {
    return null;
  }

  const fileName = source.url?.split("/").slice(-1)[0];

  const openSource = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    trackEvent("console.select_source");

    if (inspectFunctionDefinition !== null) {
      inspectFunctionDefinition([location]);
    }
  };

  return (
    <span
      className={`${styles.Source} ${className}`}
      data-test-name="Console-Source"
      onClick={openSource}
      title={`${fileName ?? "unknown"}:${location.line}`}
    >
      {fileName ?? <span className={styles.UnknownSourceLabel}>unknown</span>}:{location.line}
    </span>
  );
}

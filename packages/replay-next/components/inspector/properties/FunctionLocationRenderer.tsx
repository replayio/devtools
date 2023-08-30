import { Object as ProtocolObject } from "@replayio/protocol";
import classNames from "classnames";
import { useContext } from "react";

import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./shared.module.css";

type FunctionLocationRendererProps = {
  object: ProtocolObject;
};

export default function FunctionLocationRenderer({ object }: FunctionLocationRendererProps) {
  const client = useContext(ReplayClientContext);
  const { inspectFunctionDefinition } = useContext(InspectorContext);
  const { preferredGeneratedSourceIds } = useContext(SourcesContext);

  const sourcesById = sourcesByIdCache.read(client);
  const functionLocation = object?.preview?.functionLocation;

  if (!functionLocation) {
    return null;
  }

  const preferredFunctionLocation = getPreferredLocation(
    sourcesById,
    preferredGeneratedSourceIds,
    functionLocation
  );
  const source = sourcesById.get(preferredFunctionLocation.sourceId);
  const fileName = source ? getSourceFileName(source) : preferredFunctionLocation.sourceId;
  const fnLocation = `${fileName}:${preferredFunctionLocation.line}`;

  return (
    <span
      className={classNames(styles.KeyValue, styles.ToggleAlignmentPadding)}
      data-test-name="KeyValue"
    >
      <span className={styles.BucketLabel} data-test-name="KeyValue-Header">
        [[FunctionLocation]]
      </span>
      <span className={styles.Separator}>: </span>
      <span
        onClick={() => {
          if (inspectFunctionDefinition !== null) {
            inspectFunctionDefinition(functionLocation);
          }
        }}
        className={styles.SourceLocationLink}
        data-test-name="ClientValue"
      >
        {fnLocation}
      </span>
    </span>
  );
}

import { Object as ProtocolObject } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { KeyValueHeader } from "../KeyValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Function with a format of:
//   function Name(param1, param2) ↗
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function FunctionRenderer({ object }: ObjectPreviewRendererProps) {
  const { inspectFunctionDefinition } = useContext(InspectorContext);

  const { functionLocation, functionName, functionParameterNames = [] } = object?.preview ?? {};
  const showOverflowMarker =
    object?.preview?.overflow || functionParameterNames.length > MAX_PROPERTIES_TO_PREVIEW;

  const viewFunctionSource = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (inspectFunctionDefinition !== null) {
      inspectFunctionDefinition(functionLocation!);
    }
  };

  const slice = functionParameterNames.slice(0, MAX_PROPERTIES_TO_PREVIEW);

  return (
    <>
      <span className={styles.FunctionKeyword}>ƒ</span>
      <span className={styles.FunctionName}>{functionName}</span>
      <span className={styles.FunctionParametersList}>
        {"("}
        {slice.map((parameterName, index) => (
          <span key={index} className={styles.Value}>
            {parameterName}
            {index < slice.length - 1 && <span className={styles.Separator}>, </span>}
          </span>
        ))}

        {showOverflowMarker && (
          <>
            <span className={styles.Separator}>, </span>
            <span className={styles.Value}>…</span>
          </>
        )}
        {")"}
      </span>
      {functionLocation && inspectFunctionDefinition !== null && (
        <button
          className={styles.IconButton}
          date-test-name="JumpToDefinitionButton"
          onClick={viewFunctionSource}
          title="Jump to definition"
        >
          <Icon className={styles.Icon} type="view-function-source" />
        </button>
      )}
    </>
  );
}

export function functionProtocolObjectToString(protocolObject: ProtocolObject) {
  const { preview } = protocolObject;

  const { functionName, functionParameterNames = [] } = preview ?? {};

  return `${functionName}(${functionParameterNames.join(", ")}) {}`;
}

type FunctionLocationRendererProps = {
  object: ProtocolObject;
};

export function FunctionLocationRenderer({ object }: FunctionLocationRendererProps) {
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
    <KeyValueHeader
      value={
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
      }
      nameClass={styles.BucketLabel}
      layout="vertical"
      name="[[FunctionLocation]]"
    />
  );
}

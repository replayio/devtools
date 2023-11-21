import { Object as ProtocolObject } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";

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
          data-test-name="JumpToDefinitionButton"
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

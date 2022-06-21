import { ObjectPreviewRendererProps } from "./types";

import Icon from "../../Icon";

import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Function with a format of:
//   function Name(param1, param2) ↗
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function FunctionRenderer({ object }: ObjectPreviewRendererProps) {
  const { functionName, functionParameterNames = [] } = object?.preview ?? {};
  const showOverflowMarker =
    object?.preview?.overflow || functionParameterNames.length > MAX_PROPERTIES_TO_PREVIEW;

  const jumpToDefinition = () => {
    // In the real app, this would open the Source viewer.
    alert("Source viewer is not implemented yet");
  };

  return (
    <>
      <span className={styles.FunctionKeyword}>ƒ</span>
      <span className={styles.FunctionName}>{functionName}</span>
      <span className={styles.FunctionParametersList}>
        {functionParameterNames.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((parameterName, index) => (
          <span key={index} className={styles.Value}>
            {parameterName}
          </span>
        ))}
        {showOverflowMarker && <span className={styles.Value}>…</span>}
      </span>
      <button className={styles.IconButton} onClick={jumpToDefinition}>
        <Icon className={styles.JumpToDefinitionIcon} type="jump-to-definition" />
      </button>
    </>
  );
}

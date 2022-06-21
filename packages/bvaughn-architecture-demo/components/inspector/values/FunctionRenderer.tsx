import { ObjectPreviewRendererProps } from "./types";

import Icon from "../../Icon";

import styles from "./shared.module.css";

// Renders a protocol ObjectPreview representing a Function with a format of:
//   function Name(param1, param2) ↗
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function FunctionRenderer({ object }: ObjectPreviewRendererProps) {
  const { functionName, functionParameterNames = [] } = object?.preview ?? {};

  const jumpToDefinition = () => {
    // In the real app, this would open the Source viewer.
    alert("Source viewer is not implemented yet");
  };

  return (
    <>
      <span className={styles.FunctionKeyword}>ƒ</span>
      <span className={styles.FunctionName}>{functionName}</span>
      <span className={styles.FunctionParametersList}>
        {functionParameterNames.map((parameterName, index) => (
          <span key={index} className={styles.Value}>
            {parameterName}
          </span>
        ))}
      </span>
      <button className={styles.IconButton} onClick={jumpToDefinition}>
        <Icon className={styles.JumpToDefinitionIcon} type="jump-to-definition" />
      </button>
    </>
  );
}

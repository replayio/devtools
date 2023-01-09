import { Object as ProtocolObject } from "@replayio/protocol";

import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

// Renders a protocol ObjectPreview representing a RegExp with a format of:
//   /abc[123]+/i
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function RegExpRenderer({ object }: ObjectPreviewRendererProps) {
  return <span className={styles.RegExp}>{regExpProtocolObjectToString(object)}</span>;
}

export function regExpProtocolObjectToString(protocolObject: ProtocolObject) {
  const { className, preview } = protocolObject;

  return preview?.regexpString ?? className;
}

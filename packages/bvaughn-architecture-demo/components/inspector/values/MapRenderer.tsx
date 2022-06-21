import ValueRenderer from "../ValueRenderer";

import { ObjectPreviewRendererProps } from "./types";

import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Map with a format of:
//   Map (3) { foo -> "abc", bar -> 123, baz -> Map, … }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function MapRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const { containerEntries = [], containerEntryCount = 0, overflow = false } = object.preview || {};
  const showOverflowMarker = overflow || containerEntries.length > MAX_PROPERTIES_TO_PREVIEW;

  if (containerEntryCount === 0) {
    return <>{object.className} (0)</>;
  } else {
    return (
      <>
        {object.className}
        <div className={styles.ArrayLength}>({containerEntryCount})</div>
        <div className={styles.ObjectPropertyList}>
          {containerEntries.slice(0, MAX_PROPERTIES_TO_PREVIEW).map(({ key, value }, index) => (
            <span key={index} className={styles.Value}>
              {key?.value && <span className={styles.MapKey}>{key?.value}</span>}
              <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
            </span>
          ))}
          {showOverflowMarker && <span className={styles.ObjectProperty}>…</span>}
        </div>
      </>
    );
  }
}

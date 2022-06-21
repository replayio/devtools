import ValueRenderer from "../ValueRenderer";

import { ObjectPreviewRendererProps } from "./types";

import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Set with a format of:
//   Set (3) [ 123, "string", Set, … ]
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function SetRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const { containerEntries = [], containerEntryCount = 0, overflow = false } = object.preview || {};
  const showOverflowMarker = overflow || containerEntries.length > MAX_PROPERTIES_TO_PREVIEW;

  if (containerEntryCount === 0) {
    return <>{object.className} (0)</>;
  } else {
    return (
      <>
        {object.className}
        <div className={styles.ArrayLength}>({containerEntryCount})</div>
        <span className={styles.ArrayPropertyList}>
          {containerEntries.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((property, index) => (
            <span key={index} className={styles.Value}>
              <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={property.value} />
            </span>
          ))}
          {showOverflowMarker && <span className={styles.ObjectProperty}>…</span>}
        </span>
      </>
    );
  }
}

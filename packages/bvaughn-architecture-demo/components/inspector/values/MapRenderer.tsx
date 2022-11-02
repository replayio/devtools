import { ReactNode } from "react";

import KeyValueRenderer from "../KeyValueRenderer";
import ValueRenderer from "../ValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Map with a format of:
//   Map (3) { foo -> "abc", bar -> 123, baz -> Map, … }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function MapRenderer({ context, object, pauseId }: ObjectPreviewRendererProps) {
  const { containerEntries = [], containerEntryCount, overflow = false } = object.preview || {};
  const showOverflowMarker = overflow || containerEntries.length > MAX_PROPERTIES_TO_PREVIEW;

  const slice = containerEntries.slice(0, MAX_PROPERTIES_TO_PREVIEW);

  if (containerEntryCount === undefined) {
    return <>{object.className}</>;
  } else if (containerEntryCount === 0) {
    return (
      <>
        {object.className}
        <span className={styles.ArrayLength}>({containerEntryCount})</span>
      </>
    );
  } else {
    let propertiesList: ReactNode[] | null = null;
    if (context !== "nested") {
      propertiesList = slice.map(({ key, value }, index) => (
        <span key={index} className={styles.Value}>
          {key != null && (
            <>
              <span className={styles.MapKey}>
                <KeyValueRenderer
                  context="nested"
                  enableInspection={false}
                  layout="horizontal"
                  pauseId={pauseId}
                  protocolValue={key}
                />
              </span>
              <span className={styles.Separator}> → </span>
            </>
          )}
          <ValueRenderer context="nested" pauseId={pauseId} protocolValue={value} />
          {index < slice.length - 1 && <span className={styles.Separator}>, </span>}
        </span>
      ));

      if (showOverflowMarker) {
        propertiesList.push(
          <span key="Separator" className={styles.Separator}>
            ,{" "}
          </span>
        );
        propertiesList.push(
          <span key="Ellipsis" className={styles.ObjectProperty}>
            …
          </span>
        );
      }
    }

    return (
      <>
        {object.className}
        <span className={styles.ArrayLength}>({containerEntryCount})</span>
        {propertiesList !== null && (
          <span className={styles.ObjectPropertyList}>
            {" {"}
            {propertiesList || "…"}
            {"}"}
          </span>
        )}
      </>
    );
  }
}

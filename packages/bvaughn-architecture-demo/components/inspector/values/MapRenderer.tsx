import { ReactNode, useContext } from "react";

import PreviewContext from "./PreviewContext";
import ValueRenderer from "../ValueRenderer";

import styles from "./shared.module.css";
import { ObjectPreviewRendererProps } from "./types";
import KeyValueRenderer from "../KeyValueRenderer";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing a Map with a format of:
//   Map (3) { foo -> "abc", bar -> 123, baz -> Map, … }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function MapRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const isWithinPreview = useContext(PreviewContext);

  const { containerEntries = [], containerEntryCount = 0, overflow = false } = object.preview || {};
  const showOverflowMarker = overflow || containerEntries.length > MAX_PROPERTIES_TO_PREVIEW;

  const slice = containerEntries.slice(0, MAX_PROPERTIES_TO_PREVIEW);

  if (containerEntryCount === 0) {
    return <>{object.className} (0)</>;
  } else {
    let propertiesList: ReactNode[] | null = null;
    if (!isWithinPreview) {
      propertiesList = slice.map(({ key, value }, index) => (
        <span key={index} className={styles.Value}>
          {key != null && (
            <>
              <span className={styles.MapKey}>
                <KeyValueRenderer
                  enableInspection={false}
                  isNested={true}
                  layout="horizontal"
                  pauseId={pauseId}
                  protocolValue={key}
                />
              </span>
              <span className={styles.Separator}> → </span>
            </>
          )}
          <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={value} />
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
          <PreviewContext.Provider value={true}>
            <span className={styles.ObjectPropertyList}>
              {" {"}
              {propertiesList || "…"}
              {"}"}
            </span>
          </PreviewContext.Provider>
        )}
      </>
    );
  }
}

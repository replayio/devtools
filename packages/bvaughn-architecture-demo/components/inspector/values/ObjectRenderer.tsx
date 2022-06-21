import { ObjectPreviewRendererProps } from "./types";

import { filterNonEnumerableProperties } from "../../../src/utils/protocol";

import KeyValueRenderer from "../KeyValueRenderer";

import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Default renderer for protocol ObjectPreview; renders a format of:
//   Object { foo: "abc", bar: 123, … }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ObjectRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const { className, preview } = object;

  const properties = filterNonEnumerableProperties(preview?.properties ?? []);
  const showOverflowMarker =
    object.preview?.overflow || properties.length > MAX_PROPERTIES_TO_PREVIEW;

  return (
    <>
      {className !== "Object" ? className : null}
      <div className={styles.ObjectPropertyList}>
        {properties.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((property, index) => (
          <span key={index} className={styles.Value}>
            <KeyValueRenderer
              enableInspection={false}
              isNested={true}
              layout="horizontal"
              pauseId={pauseId}
              protocolValue={property}
            />
          </span>
        ))}
        {showOverflowMarker && <span className={styles.Property}>…</span>}
      </div>
    </>
  );
}

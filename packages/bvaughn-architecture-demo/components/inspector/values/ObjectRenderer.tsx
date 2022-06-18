import { ObjectPreviewRendererProps } from "./types";

import KeyValueRenderer from "../KeyValueRenderer";

import styles from "./shared.module.css";

// Default renderer for protocol ObjectPreview; renders a format of:
//   Object { foo: "abc", bar: 123, ... }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ObjectRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  // TODO (inspector) Is this the right way to filter properties?
  const properties = (object.preview?.properties ?? []).filter(property => property.flags !== 1);

  return (
    <>
      {object.className}
      <div className={styles.ObjectPropertyList}>
        {properties.map((property, index) => (
          <span key={index} className={styles.Value}>
            <KeyValueRenderer
              enableInspection={false}
              layout="horizontal"
              pauseId={pauseId}
              protocolValue={property}
            />
          </span>
        ))}
        {object.preview?.overflow && <span className={styles.Property}>...</span>}
      </div>
    </>
  );
}

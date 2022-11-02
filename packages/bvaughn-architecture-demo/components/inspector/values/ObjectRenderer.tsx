import { ReactNode, useMemo } from "react";

import { mergePropertiesAndGetterValues } from "bvaughn-architecture-demo/src/utils/protocol";

import KeyValueRenderer from "../KeyValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Default renderer for protocol ObjectPreview; renders a format of:
//   Object { foo: "abc", bar: 123, … }
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ObjectRenderer({ context, object, pauseId }: ObjectPreviewRendererProps) {
  const { className, preview } = object;

  const [properties, propertiesWereTruncated] = useMemo(() => {
    if (preview == null) {
      return [[], false];
    }

    return mergePropertiesAndGetterValues(
      preview.properties || [],
      preview.getterValues || [],
      MAX_PROPERTIES_TO_PREVIEW
    );
  }, [preview]);

  const showOverflowMarker = object.preview?.overflow || propertiesWereTruncated;

  let propertiesList: ReactNode[] | null = null;
  if (context !== "nested") {
    propertiesList = properties.map((property, index) => (
      <span key={index} className={styles.Value}>
        <KeyValueRenderer
          context="nested"
          enableInspection={false}
          layout="horizontal"
          pauseId={pauseId}
          protocolValue={property}
        />
        {index < properties.length - 1 && <span className={styles.Separator}>, </span>}
      </span>
    ));

    if (showOverflowMarker) {
      if (properties.length > 0) {
        // It's possible that we have no unfiltered properties, but still have overflow.
        propertiesList.push(
          <span key="Separator" className={styles.Separator}>
            ,{" "}
          </span>
        );
      }

      propertiesList.push(
        <span key="Ellipsis" className={styles.ObjectProperty}>
          …
        </span>
      );
    }
  }

  return (
    <>
      {className !== "Object" ? className : null}
      <span className={styles.ObjectPropertyList}>
        {"{"}
        {propertiesList || "…"}
        {"}"}
      </span>
    </>
  );
}

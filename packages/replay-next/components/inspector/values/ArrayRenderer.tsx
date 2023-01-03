import { ReactNode } from "react";

import { filterNonEnumerableProperties } from "bvaughn-architecture-demo/src/utils/protocol";

import ValueRenderer from "../ValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing an Array with a format of:
//   Array (3) ["foo", bar, 123]
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ArrayRenderer({ context, object, pauseId }: ObjectPreviewRendererProps) {
  const { className, preview } = object;

  const properties = filterNonEnumerableProperties(preview?.properties ?? []).filter(
    property => property.name !== "length"
  );

  const showOverflowMarker = preview?.overflow || properties.length > MAX_PROPERTIES_TO_PREVIEW;

  const lengthValue =
    preview?.properties?.find(({ name }) => name === "length") ||
    preview?.getterValues?.find(({ name }) => name === "length");
  const length = lengthValue?.value || 0;

  const slice = properties.slice(0, MAX_PROPERTIES_TO_PREVIEW);

  let propertiesList: ReactNode[] | null = null;
  if (context !== "nested") {
    propertiesList = slice.map((property, index) => (
      <span key={index} className={styles.Value}>
        <ValueRenderer context="nested" pauseId={pauseId} protocolValue={property} />
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

  // Chrome shortens arrays to e.g. "(3) [1,2,3]" but displays the full name for typed arrays.
  const showClassName = context === "nested" || className !== "Array";

  return (
    <>
      {showClassName ? className : null}
      {length > 0 && <span className={styles.ArrayLength}>({length})</span>}
      {propertiesList !== null && (
        <span className={styles.ArrayPropertyList}>
          {" ["}
          {propertiesList || "…"}
          {"]"}
        </span>
      )}
    </>
  );
}

import { filterNonEnumerableProperties } from "@bvaughn/src/utils/protocol";
import { ReactNode, useContext } from "react";

import ValueRenderer from "../ValueRenderer";

import PreviewContext from "./PreviewContext";
import styles from "./shared.module.css";
import { ObjectPreviewRendererProps } from "./types";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing an Array with a format of:
//   Array (3) ["foo", bar, 123]
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ArrayRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const isWithinPreview = useContext(PreviewContext);

  const properties = filterNonEnumerableProperties(object.preview?.properties ?? []);
  const showOverflowMarker =
    object.preview?.overflow || properties.length > MAX_PROPERTIES_TO_PREVIEW;

  const getterValue = object.preview?.getterValues?.find(({ name }) => name === "length");
  const length = getterValue?.value || 0;

  const slice = properties.slice(0, MAX_PROPERTIES_TO_PREVIEW);

  let propertiesList: ReactNode[] | null = null;
  if (!isWithinPreview) {
    propertiesList = slice.map((property, index) => (
      <span key={index} className={styles.Value}>
        <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={property} />
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
      Array
      {length > 0 && <span className={styles.ArrayLength}>({length})</span>}
      <PreviewContext.Provider value={true}>
        {propertiesList !== null && (
          <span className={styles.ArrayPropertyList}>
            {" ["}
            {propertiesList || "…"}
            {"]"}
          </span>
        )}
      </PreviewContext.Provider>
    </>
  );
}

import { ObjectPreviewRendererProps } from "./types";

import { filterNonEnumerableProperties } from "../../../src/utils/protocol";

import ValueRenderer from "../ValueRenderer";

import styles from "./shared.module.css";

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing an Array with a format of:
//   Array (3) ["foo", bar, 123]
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function ArrayRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const properties = filterNonEnumerableProperties(object.preview?.properties ?? []);
  const showOverflowMarker =
    object.preview?.overflow || properties.length > MAX_PROPERTIES_TO_PREVIEW;

  const getterValue = object.preview?.getterValues?.find(({ name }) => name === "length");
  const length = getterValue?.value || 0;

  return (
    <>
      Array
      {length > 0 && <div className={styles.ArrayLength}>({length})</div>}
      <span className={styles.ArrayPropertyList}>
        {properties.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((property, index) => (
          <span key={index} className={styles.Value}>
            <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={property} />
          </span>
        ))}
        {showOverflowMarker && <span className={styles.ObjectProperty}>…</span>}
      </span>
    </>
  );
}

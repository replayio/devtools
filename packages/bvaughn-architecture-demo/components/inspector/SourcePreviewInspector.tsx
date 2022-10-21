import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { getObjectWithPreview } from "@bvaughn/src/suspense/ObjectPreviews";
import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { MouseEvent, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import PropertiesRenderer from "./PropertiesRenderer";

import styles from "./SourcePreviewInspector.module.css";
import useClientValue from "./useClientValue";

export default function SourcePreviewInspector({
  className = "",
  pauseId,
  protocolValue,
}: {
  className?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const clientValue = useClientValue(protocolValue, pauseId);
  switch (clientValue.type) {
    case "array":
    case "function":
    case "html-element":
    case "html-text":
    case "map":
    case "object":
    case "regexp":
    case "set": {
      return (
        <div
          className={`${styles.SourcePreviewInspector} ${className}`}
          data-test-name="SourcePreviewInspector"
        >
          <ObjectWrapper pauseId={pauseId} protocolValue={protocolValue} />
        </div>
      );
    }
    default: {
      return (
        <div
          className={`${styles.SourcePreviewInspector} ${className}`}
          data-test-name="SourcePreviewInspector"
        >
          <div className={styles.InspectorWrapper}>
            <Suspense fallback={<Loader />}>
              <Inspector
                className={styles.Inspector}
                context="default"
                expandByDefault={true}
                pauseId={pauseId!}
                protocolValue={protocolValue}
              />
            </Suspense>
          </div>
        </div>
      );
    }
  }
}

function ObjectWrapper({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = useClientValue(protocolValue, pauseId);

  const { name, objectId, type } = clientValue;

  const objectWithPreview = getObjectWithPreview(client, pauseId, objectId!);
  if (objectWithPreview == null) {
    throw Error(`Could not find object with ID "${objectId!}"`);
  }

  const { className, preview } = objectWithPreview;

  let header = null;

  switch (type) {
    case "array":
      const lengthValue =
        preview?.properties?.find(({ name }) => name === "length") ||
        preview?.getterValues?.find(({ name }) => name === "length");
      const length = lengthValue?.value || 0;
      header = `${className}(${length})`;
      break;
    case "function":
      // TODO It would be nice if Replay differentiated between classes and functions but it doesn't seem to.
      header = name ? `ƒ ${name}()` : "ƒ()";
      break;
    case "html-element":
      const tagName = (preview?.node?.nodeName || "unknown").toLowerCase();
      header = tagName || className;
      break;
    case "html-text":
      header = "#text";
      break;
    case "map":
    case "set":
      const sizeValue =
        preview?.properties?.find(({ name }) => name === "size") ||
        preview?.getterValues?.find(({ name }) => name === "size");
      const size = sizeValue?.value || 0;
      header = `${className}(${size})`;
      break;
    case "regexp":
      header = preview?.regexpString || className;
      break;
    default:
      header = className;
      break;
  }

  return (
    <>
      <div className={styles.HeaderWrapper} data-test-name="SourcePreviewInspectorHeader">
        <div className={styles.Header}>{header}</div>
      </div>
      <div className={styles.InspectorWrapper}>
        <Suspense fallback={<Loader />}>
          <PropertiesRenderer object={objectWithPreview} pauseId={pauseId} />
        </Suspense>
      </div>
    </>
  );
}

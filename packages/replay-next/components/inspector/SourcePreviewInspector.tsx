import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { ForwardedRef, Suspense, forwardRef, useContext } from "react";

import Inspector from "replay-next/components/inspector";
import Loader from "replay-next/components/Loader";
import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import PropertiesRenderer from "./PropertiesRenderer";
import styles from "./SourcePreviewInspector.module.css";

type Props = {
  className?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue;
};

export default forwardRef<HTMLDivElement, Props>(function SourcePreviewInspector(
  { className = "", pauseId, protocolValue }: Props,
  ref: ForwardedRef<HTMLDivElement>
) {
  const client = useContext(ReplayClientContext);
  const clientValue = clientValueCache.read(client, pauseId, protocolValue);
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
          data-private
          data-test-name="SourcePreviewInspector"
          ref={ref}
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
          ref={ref}
        >
          <div className={styles.InspectorWrapper} data-private>
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
});

function ObjectWrapper({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = clientValueCache.read(client, pauseId, protocolValue);

  const { name, objectId, type } = clientValue;

  const objectWithPreview = objectCache.read(client, pauseId, objectId!, "canOverflow");
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
      <div className={styles.FixedSizeInspectorWrapper}>
        <Suspense fallback={<Loader />}>
          <PropertiesRenderer object={objectWithPreview} pauseId={pauseId} />
        </Suspense>
      </div>
    </>
  );
}

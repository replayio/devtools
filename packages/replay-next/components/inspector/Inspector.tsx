import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Loader from "../Loader";
import KeyValueRenderer from "./KeyValueRendererWithContextMenu";
import PropertiesRenderer from "./PropertiesRenderer";
import styles from "./Inspector.module.css";

export default function Inspector({
  className,
  context,
  path,
  pauseId,
  protocolValue,
  hidePreview,
  expandByDefault,
}: {
  className?: string;
  context: "console" | "default";
  path?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
  hidePreview?: boolean;
  expandByDefault?: boolean;
}) {
  const client = useContext(ReplayClientContext);
  let keyValue;

  if (hidePreview) {
    const clientValue = clientValueCache.read(client, pauseId, protocolValue);

    const { objectId } = clientValue;

    const objectWithPreview = objectCache.read(client, pauseId, objectId!, "canOverflow");
    if (objectWithPreview == null) {
      throw Error(`Could not find object with ID "${objectId!}"`);
    }

    keyValue = (
      <div className={styles.InspectorWrapper}>
        <Suspense fallback={<Loader />}>
          <PropertiesRenderer path={path} object={objectWithPreview} pauseId={pauseId} />
        </Suspense>
      </div>
    );
  } else {
    keyValue = (
      <KeyValueRenderer
        context={context}
        expandByDefault={expandByDefault}
        layout="horizontal"
        path={path}
        pauseId={pauseId}
        protocolValue={protocolValue}
      />
    );
  }

  if (context === "console") {
    return keyValue;
  } else {
    return (
      <div className={`${styles.Inspector} ${className || ""}`} data-test-name="InspectorRoot">
        {keyValue}
      </div>
    );
  }
}

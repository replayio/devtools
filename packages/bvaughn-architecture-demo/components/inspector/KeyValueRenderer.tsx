import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import classNames from "classnames";
import { ReactNode, Suspense, useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import Collapsible from "./Collapsible";
import styles from "./KeyValueRenderer.module.css";
import PropertiesRenderer from "./PropertiesRenderer";
import useClientValue from "./useClientValue";
import ValueRenderer from "./ValueRenderer";

// Renders a protocol Object/ObjectPreview as a key+value pair.
//
// This renderer supports two layouts: "horizontal" and "vertical".
//   * Horizontal layout is suited for console messages and rendering preview values (within an Array or Object).
//   * Vertical layout is suited for lists of properties (like when inspected nested values).
//
// Property inspection can be disabled for rendering preview values (within an Array or Object).
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function KeyValueRenderer({
  before = null,
  enableInspection = true,
  isNested = false,
  layout = "horizontal",
  pauseId,
  protocolValue,
}: {
  before?: ReactNode;
  enableInspection?: boolean;
  isNested?: boolean;
  layout?: "horizontal" | "vertical";
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = useClientValue(protocolValue, pauseId);

  const { objectId, name, type } = clientValue;

  let showCollapsibleView = false;
  if (enableInspection) {
    switch (type) {
      case "array":
      case "function":
      case "object": {
        showCollapsibleView = true;
      }
    }
  }

  const keyValue = (
    <div
      className={classNames(
        styles.KeyValue,
        !showCollapsibleView && layout === "vertical" ? styles.ToggleAlignmentPadding : null
      )}
    >
      {before}
      {name != null ? <span className={styles.Name}>{name}</span> : null}
      <ValueRenderer
        isNested={isNested}
        layout={layout}
        pauseId={pauseId}
        protocolValue={protocolValue}
      />
    </div>
  );

  if (showCollapsibleView) {
    const object = getObjectWithPreview(client, pauseId, objectId!);
    if (object == null) {
      throw Error(`Could not find object with ID "${objectId}"`);
    }

    // TODO (inspector) If this is an HTMLElement, render an HTMLPropertiesRenderer (which shows HTML children only)

    return (
      <Collapsible
        header={keyValue}
        renderChildren={() => (
          <Suspense fallback="Loading...">
            <PropertiesRenderer object={object} pauseId={pauseId} />
          </Suspense>
        )}
      />
    );
  } else {
    return keyValue;
  }
}

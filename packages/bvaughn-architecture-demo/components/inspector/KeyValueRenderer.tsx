import { Object as ProtocolObject, PauseId, Value as ProtocolValue } from "@replayio/protocol";
import classNames from "classnames";
import { ReactNode, Suspense, useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";
import { getObjectType } from "../../src/utils/protocol";

import Collapsible from "./Collapsible";
import HTMLChildrenRenderer from "./HTMLChildrenRenderer";
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
  isNested: boolean;
  layout: "horizontal" | "vertical";
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = useClientValue(protocolValue, pauseId);

  const { objectId, name, type } = clientValue;

  let objectWithPreview: ProtocolObject | null = null;
  let isHTMLType = false;
  let showCollapsibleView = false;
  if (enableInspection) {
    switch (type) {
      case "array":
      case "function":
      case "object": {
        objectWithPreview = getObjectWithPreview(client, pauseId, objectId!);
        if (objectWithPreview == null) {
          throw Error(`Could not find object with ID "${objectId}"`);
        }

        if (getObjectType(objectWithPreview) === "html") {
          isHTMLType = true;

          if (
            objectWithPreview.preview?.node?.childNodes != null &&
            objectWithPreview.preview.node.childNodes.length > 0
          ) {
            // Don't show the expand/collapse toggle for HTML elements that have no children.
            // This is what Chrome does and we're mimicking it.
            showCollapsibleView = true;
            console.log("showCollapsibleView?", objectWithPreview);
          }
        } else {
          showCollapsibleView = true;
        }
      }
    }
  }
  console.log("<KeyValueRenderer>", protocolValue, objectWithPreview);

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
    let children;
    if (isHTMLType) {
      children = (
        <Suspense fallback="Loading...">
          <HTMLChildrenRenderer object={objectWithPreview!} pauseId={pauseId} />
        </Suspense>
      );
    } else {
      children = (
        <Suspense fallback="Loading...">
          <PropertiesRenderer object={objectWithPreview!} pauseId={pauseId} />
        </Suspense>
      );
    }

    return <Collapsible children={children} header={keyValue} />;
  } else {
    return keyValue;
  }
}

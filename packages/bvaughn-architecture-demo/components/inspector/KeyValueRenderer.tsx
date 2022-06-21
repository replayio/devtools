import { Object as ProtocolObject, PauseId, Value as ProtocolValue } from "@replayio/protocol";
import classNames from "classnames";
import { ReactNode, Suspense, useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import Loader from "../Loader";

import Collapsible from "./Collapsible";
import HTMLCollapsible from "./HTMLCollapsible";
import styles from "./KeyValueRenderer.module.css";
import PropertiesRenderer from "./PropertiesRenderer";
import useClientValue from "./useClientValue";
import ValueRenderer from "./ValueRenderer";
import HTMLElementRenderer from "./values/HTMLElementRenderer";

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
  let showCollapsibleView = false;
  if (enableInspection) {
    switch (type) {
      case "array":
      case "function":
      case "html-element":
      case "html-text":
      case "map":
      case "object":
      case "regexp":
      case "set": {
        objectWithPreview = getObjectWithPreview(client, pauseId, objectId!);
        if (objectWithPreview == null) {
          throw Error(`Could not find object with ID "${objectId}"`);
        }

        if (clientValue.type === "html-element" || clientValue.type === "html-text") {
          // HTMLElements require nested preview objects to be loaded also in order to properly render inline.
          // This is because text node children and HTML element children are treated differently.
          // Text node children may be rendered as part of the inline preview, if there is only one child.
          if (objectWithPreview.preview!.overflow) {
            objectWithPreview = getObjectWithPreview(client, pauseId, objectId!, true);
          }

          const childNodes = objectWithPreview.preview?.node?.childNodes ?? [];
          const htmlElementChildren = childNodes.filter(childNodeId => {
            const childNode = getObjectWithPreview(client, pauseId, childNodeId);
            return childNode.className !== "Text";
          });

          // Only show the expand/collapse toggle for HTML elements that have HTMLElements as children.
          // Children that are text nodes will be rendered inline, as part of the value/preview.
          if (htmlElementChildren.length > 0) {
            return (
              <div className={classNames(styles.KeyValue)}>
                <HTMLCollapsible
                  before={
                    <>
                      {before}
                      {name != null ? <span className={styles.VerticalName}>{name}</span> : null}
                    </>
                  }
                  object={objectWithPreview!}
                  pauseId={pauseId}
                />
              </div>
            );
          } else {
            showCollapsibleView = false;
          }
        } else {
          showCollapsibleView = true;
        }
      }
    }
  }

  let nameClass;
  if (layout === "horizontal") {
    nameClass = styles.HorizontalName;
  } else {
    if ((protocolValue as any).flags > 0) {
      nameClass = styles.VerticalNameWithFlag;
    } else {
      nameClass = styles.VerticalName;
    }
  }

  const header = (
    <div
      className={classNames(
        styles.KeyValue,
        !showCollapsibleView && layout === "vertical" ? styles.ToggleAlignmentPadding : null
      )}
    >
      {before}
      {name != null ? <span className={nameClass}>{name}</span> : null}
      <ValueRenderer
        isNested={isNested}
        layout={layout}
        pauseId={pauseId}
        protocolValue={protocolValue}
      />
    </div>
  );

  if (showCollapsibleView) {
    return (
      <Collapsible
        children={
          <Suspense fallback={<Loader />}>
            <PropertiesRenderer object={objectWithPreview!} pauseId={pauseId} />
          </Suspense>
        }
        header={header}
      />
    );
  } else {
    return header;
  }
}

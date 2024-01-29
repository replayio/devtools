import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Object as ProtocolObject,
  Value as ProtocolValue,
} from "@replayio/protocol";
import classNames from "classnames";
import { MouseEvent, ReactNode, Suspense, useContext, useState } from "react";

import Expandable from "replay-next/components/Expandable";
import Loader from "replay-next/components/Loader";
import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import HTMLExpandable from "./HTMLExpandable";
import PropertiesRenderer from "./PropertiesRenderer";
import ValueRenderer from "./ValueRenderer";
import styles from "./KeyValueRenderer.module.css";

export type Props = {
  before?: ReactNode;
  context: "console" | "default" | "nested";
  enableInspection?: boolean;
  expandByDefault?: boolean;
  layout?: "horizontal" | "vertical";
  onContextMenu?: (event: MouseEvent) => void;
  path?: string;
  pauseId: PauseId;
  protocolValue: (ProtocolValue | ProtocolNamedValue) & { isGetterValue?: boolean };
};

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
  context,
  enableInspection = true,
  expandByDefault = false,
  layout = "horizontal",
  onContextMenu,
  path,
  pauseId,
  protocolValue,
}: Props) {
  const client = useContext(ReplayClientContext);

  const [isExpanded, setIsExpanded] = useState(false);

  const clientValue = clientValueCache.read(client, pauseId, protocolValue);
  const { objectId, name, type } = clientValue;

  let objectWithPreview: ProtocolObject | null = null;
  let showExpandableView = false;
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
        objectWithPreview = objectCache.read(client, pauseId, objectId!, "canOverflow");
        if (objectWithPreview == null) {
          throw Error(`Could not find object with ID "${objectId}"`);
        }

        if (clientValue.type === "html-element" || clientValue.type === "html-text") {
          // HTMLElements require nested preview objects to be loaded also in order to properly render inline.
          // This is because text node children and HTML element children are treated differently.
          // Text node children may be rendered as part of the inline preview, if there is only one child.
          if (objectWithPreview.preview!.overflow) {
            objectWithPreview = objectCache.read(client, pauseId, objectId!, "full");
          }

          const childNodes = objectWithPreview.preview?.node?.childNodes ?? [];
          const htmlElementChildren = childNodes.filter(childNodeId => {
            const childNode = objectCache.read(client, pauseId, childNodeId, "canOverflow");
            return childNode.className !== "Text";
          });

          // Only show the expand/collapse toggle for HTML elements that have HTMLElements as children.
          // Children that are text nodes will be rendered inline, as part of the value/preview.
          if (htmlElementChildren.length > 0) {
            return (
              <span className={classNames(styles.KeyValue)} onContextMenu={onContextMenu}>
                <HTMLExpandable
                  before={
                    <>
                      {before}
                      {name != null ? (
                        <>
                          <span className={styles.VerticalName}>{name}</span>
                          <span className={styles.Separator}>: </span>
                        </>
                      ) : null}
                    </>
                  }
                  defaultOpen={expandByDefault}
                  object={objectWithPreview!}
                  path={path}
                  pauseId={pauseId}
                  protocolValue={protocolValue}
                />
              </span>
            );
          } else {
            showExpandableView = false;
          }
        } else {
          showExpandableView = true;
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
  if (protocolValue.isGetterValue) {
    nameClass += " " + styles.GetterValue;
  }

  // What we show when expanded or collapsed depends on the context we are displayed in.
  // For example, objects and arrays rendered directly within the Console won't show preview contents,
  // but will instead display a short-form (e.g. "Object" or "Array (3)").
  // When expanded, these objects will continue to display their short form representation.
  //
  // In other contexts, Objects and Arrays will display preview values when collapsed (e.g. "{foo: 123}" or "(3) [1, 2, 3]"),
  // but when expanded they will not display anything (to avoid rendering duplicate data and cluttering the inspector).
  let value: ReactNode = null;
  if (context === "console" || !isExpanded) {
    value = (
      <ValueRenderer
        layout={layout}
        context={context}
        pauseId={pauseId}
        protocolValue={protocolValue}
      />
    );
  }

  const header = (
    <span
      className={classNames(
        styles.KeyValue,
        !showExpandableView && layout === "vertical" ? styles.ToggleAlignmentPadding : null
      )}
      data-test-name="KeyValue"
      onContextMenu={onContextMenu}
    >
      {before}
      {name != null ? (
        <>
          <span className={nameClass} data-test-name="KeyValue-Header">
            {name}
          </span>
          <span className={styles.Separator}>: </span>
        </>
      ) : null}

      {value}
    </span>
  );

  if (showExpandableView) {
    return (
      <Expandable
        children={
          <Suspense fallback={<Loader />}>
            <PropertiesRenderer object={objectWithPreview!} path={path} pauseId={pauseId} />
          </Suspense>
        }
        defaultOpen={expandByDefault}
        header={header}
        onChange={setIsExpanded}
        persistenceKey={path}
      />
    );
  } else {
    return header;
  }
}

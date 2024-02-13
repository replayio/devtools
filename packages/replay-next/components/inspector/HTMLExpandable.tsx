import {
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { ReactNode, Suspense, useContext, useState } from "react";

import { ExpandablesContext } from "replay-next/src/contexts/ExpandablesContext";

import Icon from "../Icon";
import LazyActivity from "../LazyActivity";
import Loader from "../Loader";
import HTMLChildrenRenderer from "./HTMLChildrenRenderer";
import HTMLElementRenderer from "./values/HTMLElementRenderer";
import styles from "./HTMLExpandable.module.css";

export type RenderChildrenFunction = () => ReactNode;

// HTMLElements behave differently when being inspected.
// Rather than showing a list of properties, they expand to show a list of their children.
// They also show an explicit closing tag after the children list.
// This behavior is different enough to warrant a custom implementation (rather than using <Expandable>).
export default function HTMLExpandable({
  before = null,
  defaultOpen = false,
  object,
  path,
  pauseId,
  protocolValue,
}: {
  before?: ReactNode;
  defaultOpen?: boolean;
  object: ProtocolObject;
  path?: string;
  pauseId: ProtocolPauseId;
  protocolValue: ProtocolValue;
}) {
  const { isExpanded, persistIsExpanded } = useContext(ExpandablesContext);
  if (path !== undefined) {
    defaultOpen = isExpanded(path) ?? defaultOpen;
  }
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
    if (path !== undefined) {
      persistIsExpanded(path, !isOpen);
    }
  };

  return (
    <span
      className={isOpen ? styles.Expanded : styles.Collapsed}
      data-test-name="Expandable"
      data-test-state={isOpen ? "open" : "closed"}
    >
      <span
        className={styles.PreviewRow}
        onClick={toggle}
        role="button"
        data-test-name="ExpandablePreview"
      >
        <span className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>

        {before}

        <HTMLElementRenderer
          context="nested"
          pauseId={pauseId}
          object={object}
          protocolValue={protocolValue}
          showClosingTag={!isOpen}
          showChildrenIndicator={!isOpen}
          showOpeningTag={true}
        />
      </span>

      <LazyActivity mode={isOpen ? "visible" : "hidden"}>
        <span className={styles.Children} data-test-name="ExpandableChildren">
          <Suspense fallback={<Loader />}>
            <HTMLChildrenRenderer object={object} path={path} pauseId={pauseId} />
          </Suspense>

          <HTMLElementRenderer
            context="nested"
            pauseId={pauseId}
            object={object}
            protocolValue={protocolValue}
            showClosingTag={true}
            showChildrenIndicator={false}
            showOpeningTag={false}
          />
        </span>
      </LazyActivity>
    </span>
  );
}

import {
  Object as ProtocolObject,
  PauseId as ProtocolPauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { ReactNode, Suspense, useState } from "react";

import Icon from "../Icon";
import LazyOffscreen from "../LazyOffscreen";
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
  pauseId,
  protocolValue,
}: {
  before?: ReactNode;
  defaultOpen?: boolean;
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
  protocolValue: ProtocolValue;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <span className={isOpen ? styles.Expanded : styles.Collapsed} data-test-name="Expandable">
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

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <span className={styles.Children} data-test-name="ExpandableChildren">
          <Suspense fallback={<Loader />}>
            <HTMLChildrenRenderer object={object} pauseId={pauseId} />
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
      </LazyOffscreen>
    </span>
  );
}

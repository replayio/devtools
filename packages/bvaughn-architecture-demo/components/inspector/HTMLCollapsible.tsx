import { Object as ProtocolObject, PauseId as ProtocolPauseId } from "@replayio/protocol";
import { ReactNode, Suspense, useState } from "react";

import Icon from "../Icon";
import HTMLChildrenRenderer from "./HTMLChildrenRenderer";

import styles from "./HTMLCollapsible.module.css";
import useClientValue from "./useClientValue";
import HTMLElementRenderer from "./values/HTMLElementRenderer";

export type RenderChildrenFunction = () => ReactNode;

// HTMLElements behave differently when being inspected.
// Rather than showing a list of properties, they expand to show a list of their children.
// They also show an explicit closing tag after the children list.
// This behavior is different enough to warrant a custom implementation (rather than using <Collapsible>).
export default function HTMLCollapsible({
  before = null,
  object,
  pauseId,
}: {
  before?: ReactNode;
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // TODO (inspector) Use the Offscreen API to preserve child component state?

  return (
    <div className={isOpen ? styles.Expanded : styles.Collapsed}>
      <div className={styles.PreviewRow} onClick={() => setIsOpen(!isOpen)}>
        <div className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </div>

        {before}

        <HTMLElementRenderer
          pauseId={pauseId}
          object={object}
          showClosingTag={!isOpen}
          showChildrenIndicator={!isOpen}
          showOpeningTag={true}
        />
      </div>

      {isOpen ? (
        <div className={styles.Children}>
          <Suspense fallback="Loading...">
            <HTMLChildrenRenderer object={object} pauseId={pauseId} />
          </Suspense>

          <HTMLElementRenderer
            pauseId={pauseId}
            object={object}
            showClosingTag={true}
            showChildrenIndicator={false}
            showOpeningTag={false}
          />
        </div>
      ) : null}
    </div>
  );
}

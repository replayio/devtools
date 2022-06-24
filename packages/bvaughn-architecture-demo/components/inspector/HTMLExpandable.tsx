import { Object as ProtocolObject, PauseId as ProtocolPauseId } from "@replayio/protocol";
import { ReactNode, Suspense, useState } from "react";

import HTMLChildrenRenderer from "./HTMLChildrenRenderer";
import Icon from "../Icon";
import LazyOffscreen from "../LazyOffscreen";
import Loader from "../Loader";

import styles from "./HTMLExpandable.module.css";
import HTMLElementRenderer from "./values/HTMLElementRenderer";

export type RenderChildrenFunction = () => ReactNode;

// HTMLElements behave differently when being inspected.
// Rather than showing a list of properties, they expand to show a list of their children.
// They also show an explicit closing tag after the children list.
// This behavior is different enough to warrant a custom implementation (rather than using <Expandable>).
export default function HTMLExpandable({
  before = null,
  object,
  pauseId,
}: {
  before?: ReactNode;
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={isOpen ? styles.Expanded : styles.Collapsed}>
      <div className={styles.PreviewRow} onClick={toggle}>
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

      <LazyOffscreen mode={isOpen ? "visible" : "hidden"}>
        <div className={styles.Children}>
          <Suspense fallback={<Loader />}>
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
      </LazyOffscreen>
    </div>
  );
}

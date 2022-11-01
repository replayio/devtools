import { getSourceContentsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import { getSourceFileName } from "bvaughn-architecture-demo/src/utils/source";
import { newSource as ProtocolSource } from "@replayio/protocol";
import debounce from "lodash/debounce";
import { MouseEvent, Suspense, useContext, useLayoutEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Loader from "../Loader";

import PreviewPopup from "./PreviewPopup";
import styles from "./Source.module.css";
import SourceList from "./SourceList";
import getExpressionForTokenElement from "./utils/getExpressionForTokenElement";

const MOUSE_MOVE_DEBOUNCE_DURATION = 250;

export type HoveredState = {
  expression: string;
  target: HTMLElement;
};

export default function Source({
  source,
  showColumnBreakpoints,
}: {
  source: ProtocolSource;
  showColumnBreakpoints: boolean;
}) {
  return (
    <Suspense fallback={<Loader className={styles.Loader} />}>
      <SuspendingSource source={source} showColumnBreakpoints={showColumnBreakpoints} />
    </Suspense>
  );
}

function SuspendingSource({
  source,
  showColumnBreakpoints,
}: {
  source: ProtocolSource;
  showColumnBreakpoints: boolean;
}) {
  const [hoveredState, setHoveredState] = useState<HoveredState | null>(null);

  useLayoutEffect(() => {
    if (hoveredState) {
      const target = hoveredState.target;
      target.classList.add(styles.HoveredTarget);

      return () => {
        target.classList.remove(styles.HoveredTarget);
      };
    }
  }, [hoveredState]);

  const sourceRef = useRef<HTMLDivElement>(null);

  const fileName = getSourceFileName(source, true) || "unknown";

  const client = useContext(ReplayClientContext);
  const sourceContents = getSourceContentsSuspense(client, source.sourceId);

  useLayoutEffect(
    () => () => {
      // If a hover preview is visible when this Source is hidden for Offscreen
      // make sure to clean it up so it doesn't remain visible.
      setHoveredState(null);
    },
    []
  );

  // TODO Incrementally parse code using SourceContext -> visibleLines
  const code = sourceContents.contents;
  const htmlLines = parse(code, fileName);
  if (htmlLines === null) {
    return null;
  }

  const onMouseMove = ({ target }: MouseEvent) => {
    const source = sourceRef.current!;
    if (!source.contains(target as Node)) {
      // Don't react to mouse move events within e.g. the preview popup.
      return;
    }

    // HACK
    // This is kind of a janky way to differentiate tokens from non-tokens but it works for now.
    const htmlElement = target as HTMLElement;
    const className = htmlElement.className;
    const isToken = typeof className === "string" && className.startsWith("tok-");

    if (isToken) {
      // Debounce hover event to avoid showing the popup (or requesting data) in response to normal mouse movements.
      setHoverStateDebounced(htmlElement, setHoveredState);
    } else {
      // Mouse-out should immediately cancel any pending actions.
      // This avoids race cases where we might show a popup after the mouse has moused away.
      setHoverStateDebounced.cancel();
      setHoveredState(null);
    }
  };

  return (
    <div
      className={styles.Source}
      data-test-id={`Source-${source.sourceId}`}
      data-test-name="Source"
    >
      <div className={styles.SourceList} onMouseMove={onMouseMove} ref={sourceRef}>
        <AutoSizer>
          {({ height, width }) => (
            <SourceList
              height={height}
              htmlLines={htmlLines}
              showColumnBreakpoints={showColumnBreakpoints}
              source={source}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
      {hoveredState ? (
        <PreviewPopup
          containerRef={sourceRef}
          dismiss={() => setHoveredState(null)}
          expression={hoveredState.expression}
          target={hoveredState.target}
        />
      ) : null}
    </div>
  );
}

const setHoverStateDebounced = debounce(
  (element: HTMLElement | null, setHoveredState: (hoveredState: HoveredState | null) => void) => {
    let expression = null;
    if (element !== null) {
      const rowElement = element.parentElement as HTMLElement;
      expression = getExpressionForTokenElement(rowElement, element);
    }

    setHoveredState(expression ? { expression, target: element! } : null);
  },
  MOUSE_MOVE_DEBOUNCE_DURATION
);

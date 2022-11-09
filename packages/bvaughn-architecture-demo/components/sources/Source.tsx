import { newSource as ProtocolSource } from "@replayio/protocol";
import debounce from "lodash/debounce";
import { MouseEvent, Suspense, useContext, useLayoutEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import {
  StreamingSourceContents,
  getStreamingSourceContentsSuspense,
} from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import {
  StreamingParser,
  parseStreaming,
} from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Loader from "../Loader";
import PreviewPopup from "./PreviewPopup";
import SourceList from "./SourceList";
import StreamingSourceLoadingProgressHeader from "./StreamingSourceLoadingProgressHeader";
import getExpressionForTokenElement from "./utils/getExpressionForTokenElement";
import styles from "./Source.module.css";

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
      <SourceLoader source={source} showColumnBreakpoints={showColumnBreakpoints} />
    </Suspense>
  );
}

function SourceLoader({
  source,
  showColumnBreakpoints,
}: {
  source: ProtocolSource;
  showColumnBreakpoints: boolean;
}) {
  const client = useContext(ReplayClientContext);

  const streamingSourceContents = getStreamingSourceContentsSuspense(client, source.sourceId);
  if (source === null) {
    return null;
  }

  const streamingParser = parseStreaming(streamingSourceContents);
  if (streamingParser === null) {
    return null;
  }

  return (
    <SourceRenderer
      showColumnBreakpoints={showColumnBreakpoints}
      source={source}
      streamingParser={streamingParser}
      streamingSourceContents={streamingSourceContents}
    />
  );
}

function SourceRenderer({
  showColumnBreakpoints,
  source,
  streamingParser,
  streamingSourceContents,
}: {
  showColumnBreakpoints: boolean;
  source: ProtocolSource;
  streamingParser: StreamingParser;
  streamingSourceContents: StreamingSourceContents;
}) {
  const [hoveredState, setHoveredState] = useState<HoveredState | null>(null);

  useLayoutEffect(
    () => () => {
      // If a hover preview is visible when this Source is hidden for Offscreen
      // make sure to clean it up so it doesn't remain visible.
      setHoveredState(null);
    },
    []
  );

  const sourceRef = useRef<HTMLDivElement>(null);

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
              showColumnBreakpoints={showColumnBreakpoints}
              source={source}
              streamingParser={streamingParser}
              streamingSourceContents={streamingSourceContents}
              width={width}
            />
          )}
        </AutoSizer>

        <StreamingSourceLoadingProgressHeader streamingParser={streamingParser} />
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

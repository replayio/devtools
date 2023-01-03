import { newSource as ProtocolSource } from "@replayio/protocol";
import debounce from "lodash/debounce";
import { MouseEvent, Suspense, useContext, useLayoutEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import {
  StreamingSourceContents,
  getStreamingSourceContentsSuspense,
} from "replay-next/src/suspense/SourcesCache";
import { StreamingParser, parseStreaming } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Loader from "../Loader";
import PreviewPopup from "./PreviewPopup";
import SourceList from "./SourceList";
import StreamingSourceLoadingProgressHeader from "./StreamingSourceLoadingProgressHeader";
import getExpressionForTokenElement from "./utils/getExpressionForTokenElement";
import getExpressionFromString from "./utils/getExpressionFromString";
import getTextAndCursorIndex from "./utils/getTextAndCursorIndex";
import styles from "./Source.module.css";

const MOUSE_MOVE_DEBOUNCE_DURATION = 250;

export type HoveredState = {
  clientX: number | null;
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
  const { trackEventOnce } = useContext(SessionContext);
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

  const trackMouseHover = () => {
    // Analytics for onboarding
    trackEventOnce("editor.mouse_over");
  };

  const onMouseMove = (event: MouseEvent) => {
    const { clientX, clientY, defaultPrevented, target } = event;

    // If something else (like the AutoComplete component) has prevented this event, don't show a hover preview.
    // Clear any existing hover preview though, to avoid showing a stale popup.
    if (!defaultPrevented) {
      const source = sourceRef.current!;
      if (!source.contains(target as Node)) {
        // Don't react to mouse move events within e.g. the preview popup.
        return;
      }

      const htmlElement = target as HTMLElement;
      if (htmlElement.getAttribute("data-test-name") === "SourceListRow-LineSegment-PlainText") {
        // Special case: plain text lines.
        // These have no "tokens" that we can use for hit detection,
        // So we fall back to browser selection APIs to determine what text the user is hovering over.
        const textAndCursorIndex = getTextAndCursorIndex(clientX, clientY);
        if (textAndCursorIndex) {
          const [text, cursorIndex] = textAndCursorIndex;

          setHoverStateDebounced(htmlElement, text, cursorIndex, clientX, setHoveredState);
          return;
        }
      } else {
        const isToken = htmlElement.hasAttribute("data-inspectable-token");
        if (isToken) {
          // Debounce hover event to avoid showing the popup (or requesting data) in response to normal mouse movements.
          setHoverStateDebounced(htmlElement, null, null, null, setHoveredState);
          return;
        }
      }
    }

    // Mouse-out should immediately cancel any pending actions.
    // This avoids race cases where we might show a popup after the mouse has moused away.
    setHoverStateDebounced.cancel();
    setHoveredState(null);
  };

  return (
    <div
      className={styles.Source}
      data-test-id={`Source-${source.sourceId}`}
      data-test-sourceid={source.sourceId}
      data-test-name="Source"
      onMouseEnter={trackMouseHover}
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
          clientX={hoveredState.clientX}
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
  (
    element: HTMLElement,
    text: string | null,
    cursorIndex: number | null,
    clientX: number | null,
    setHoveredState: (hoveredState: HoveredState | null) => void
  ) => {
    let expression = null;
    if (text !== null && cursorIndex !== null) {
      expression = getExpressionFromString(text, cursorIndex);
    } else {
      const rowElement = element.parentElement as HTMLElement;
      expression = getExpressionForTokenElement(rowElement, element);
    }

    setHoveredState(expression ? { clientX, expression, target: element! } : null);
  },
  MOUSE_MOVE_DEBOUNCE_DURATION
);

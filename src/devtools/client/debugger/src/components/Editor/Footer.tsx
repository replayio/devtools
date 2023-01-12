import { Suspense, memo, useContext } from "react";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";

import SourcemapToggleSuspends from "./SourcemapToggle";
import SourcemapVisualizerLinkSuspends from "./SourcemapVisualizerLink";

export type CursorPosition = {
  readonly column: number;
  readonly line: number;
};

function SourceFooter() {
  const { cursorColumnIndex, cursorLineIndex } = useContext(SourcesContext);

  const cursorPosition = {
    column: cursorColumnIndex || 0,
    line: cursorLineIndex || 0,
  };

  return (
    <div className="source-footer-wrapper">
      <div className="source-footer">
        <ErrorBoundary>
          <Suspense>
            <SourcemapToggleSuspends cursorPosition={cursorPosition} />
            <SourcemapVisualizerLinkSuspends cursorPosition={cursorPosition} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default memo(SourceFooter);

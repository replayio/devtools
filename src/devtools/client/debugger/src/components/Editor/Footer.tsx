import { Suspense, memo, useContext } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
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
        <InlineErrorBoundary
          name="SourceFooter"
          fallback={<div className="error">An error occurred while replaying</div>}
        >
          <Suspense>
            <SourcemapToggleSuspends cursorPosition={cursorPosition} />
            <SourcemapVisualizerLinkSuspends cursorPosition={cursorPosition} />
          </Suspense>
        </InlineErrorBoundary>
      </div>
    </div>
  );
}

export default memo(SourceFooter);

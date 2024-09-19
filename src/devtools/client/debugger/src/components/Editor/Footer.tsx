import { Suspense, memo, useContext } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";

import { CursorPosition } from "../../utils/sourceVisualizations";
import SourcemapToggleSuspends from "./SourcemapToggle";
import SourcemapVisualizerLinkSuspends from "./SourcemapVisualizerLink";

function SourceFooter() {
  const { cursorColumnIndex, cursorLineIndex } = useContext(SourcesContext);

  const cursorPosition: CursorPosition = {
    column: cursorColumnIndex || 0,
    line: cursorLineIndex || 0,
  };

  return (
    <div className="source-footer-wrapper">
      <div className="source-footer">
        <InlineErrorBoundary
          name="SourceFooter"
          fallback={<div className="error"></div>}
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

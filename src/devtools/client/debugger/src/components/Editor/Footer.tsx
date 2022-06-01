import React, { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSource } from "../../actions/sources";

import {
  getSelectedSourceScrollPosition,
  getSelectedSourceWithContent,
  setSelectedSourceScrollPosition,
} from "../../selectors";

import SourcemapToggle from "./SourcemapToggle";
import SourcemapVisualizerLink from "./SourcemapVisualizerLink";

type CursorPosition = {
  readonly column: number;
  readonly line: number;
};

function SourceFooter() {
  const dispatch = useDispatch();
  const selectedSource = useSelector(getSelectedSourceWithContent);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 0,
    column: 0,
  });

  // On mount, restore the scroll position for the source we have selected.
  //
  // // HACK:
  // Note that we only do this for the most recently selected source.
  // Trying to track and restore scroll positions for multiple sources was finicky;
  // CodeMirror seems to have small scroll position discrepancies that were noticeable.
  const scrollPositionOnMountRef = useRef(useSelector(getSelectedSourceScrollPosition));
  useLayoutEffect(() => {
    const eventDoc = document.querySelector(".editor-mount .CodeMirror");
    const codeMirror = (eventDoc as any)?.CodeMirror;
    if (codeMirror) {
      let timeoutId: NodeJS.Timeout | null = null;

      const scrollPosition = scrollPositionOnMountRef.current;
      if (scrollPosition != null) {
        // HACK:
        // 1. CodeMirror's own CodeMirror.scrollIntoView() method should handle this but it doesn't work.
        //    That method only scrolls up (not down) due to what looks like a logic bug in the internal implementation.
        // 2. CodeMirror also sometimes requires an async delay before it works,
        //    probably due to some internal initialization detail.
        timeoutId = setTimeout(() => {
          timeoutId = null;

          codeMirror.display.scroller.scrollLeft = scrollPosition.left;
          codeMirror.display.scroller.scrollTop = scrollPosition.top;
        }, 1);
      }

      // Before unmounting, save scroll position info for this source so that it can be restored later.
      return () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        const scrollInfo = codeMirror.getScrollInfo();
        dispatch(setSelectedSourceScrollPosition(scrollInfo || null));
      };
    }
  }, [dispatch]);

  useEffect(() => {
    const eventDoc = document.querySelector(".editor-mount .CodeMirror");
    const codeMirror = (eventDoc as any)?.CodeMirror;
    if (codeMirror) {
      const onCursorActivity = (event: any) => {
        const { line, ch } = event.doc.getCursor();
        setCursorPosition({ line, column: ch });
      };

      codeMirror.on("cursorActivity", onCursorActivity);
      return () => {
        codeMirror.off("cursorActivity", onCursorActivity);
      };
    }
  });

  let cursorPositionUI = null;
  if (selectedSource) {
    const { line, column } = cursorPosition;

    // @ts-ignore
    const text = L10N.getFormatStr("sourceFooter.currentCursorPosition", line + 1, column + 1);
    // @ts-ignore
    const title = L10N.getFormatStr(
      "sourceFooter.currentCursorPosition.tooltip",
      line + 1,
      column + 1
    );

    cursorPositionUI = (
      <div className="cursor-position" title={title}>
        {text}
      </div>
    );
  }

  return (
    <div className="source-footer">
      <SourcemapToggle />
      <SourcemapVisualizerLink />
      <div className="source-footer-end">{cursorPositionUI}</div>
    </div>
  );
}

export default memo(SourceFooter);

import { useMemo, useLayoutEffect } from "react";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { getSelectedSourceId } from "ui/reducers/sources";
import { useStringPref } from "ui/hooks/settings";

import styles from "./LineHitCounts.module.css";
import { features } from "ui/utils/prefs";

import { resizeBreakpointGutter } from "../../utils/ui";
import {
  fetchHitCounts,
  HitCount,
  getHitCountsForSource,
  getBoundsForLineNumber,
} from "ui/reducers/hitCounts";
import { UIState } from "ui/state";

type Props = {
  editor: any;
};

export default function LineHitCountsWrapper(props: Props) {
  const { value: hitCountsEnabled } = useFeature("hitCounts");
  const { value: hitCountsMode } = useStringPref("hitCounts");

  if (!hitCountsEnabled || hitCountsMode == "disabled") {
    return null;
  }

  return <LineHitCounts {...props} />;
}

function LineHitCounts({ editor }: Props) {
  const dispatch = useAppDispatch();
  const sourceId = useAppSelector(getSelectedSourceId)!;
  const hitCounts = useAppSelector(state => getHitCountsForSource(state, sourceId));
  const { value: hitCountsMode, update: updateHitCountsMode } = useStringPref("hitCounts");
  const isCollapsed = hitCountsMode == "hide-counts";
  const currentLineNumber = useAppSelector(
    (state: UIState) => state.app.hoveredLineNumberLocation?.line || 0
  );
  const { lower, upper } = getBoundsForLineNumber(currentLineNumber);

  const hitCountMap = useMemo(
    () => (hitCounts !== null ? hitCountsToMap(hitCounts) : null),
    [hitCounts]
  );

  // Min/max hit counts are used to determine heat map color.
  const { minHitCount, maxHitCount } = useMemo(() => {
    let minHitCount = Infinity;
    let maxHitCount = 0;
    if (hitCounts) {
      hitCounts.forEach(hitCount => {
        if (hitCount.hits > 0) {
          if (minHitCount > hitCount.hits) {
            minHitCount = hitCount.hits;
          }
          if (maxHitCount < hitCount.hits) {
            maxHitCount = hitCount.hits;
          }
        }
      });
    }
    return { minHitCount, maxHitCount };
  }, [hitCounts]);

  useLayoutEffect(() => {
    // HACK Make sure we load hit count metadata; normally this is done in response to a mouseover event.
    if (hitCounts === null) {
      dispatch(fetchHitCounts(sourceId, 0));
    }
  }, [dispatch, sourceId, hitCounts]);

  useLayoutEffect(() => {
    if (!editor) {
      return;
    }

    const doc = editor.editor.getDoc();
    const drawLines = () => {
      // Make sure we have enough room to fit large hit count numbers.
      const numCharsToFit =
        maxHitCount < 1000
          ? Math.max(2, maxHitCount.toString().length)
          : `${(maxHitCount / 1000).toFixed(1)}k`.length;
      const gutterWidth = isCollapsed ? "1ch" : `${numCharsToFit + 1}ch`;

      editor.editor.setOption("gutters", [
        "breakpoints",
        "CodeMirror-linenumbers",
        { className: "hit-markers", style: `width: ${gutterWidth}` },
      ]);
      resizeBreakpointGutter(editor.editor);

      // HACK
      // When hit counts are shown, the hover button (to add a log point) should not overlap with the gutter.
      // That component doesn't know about hit counts though, so we can inform its position via a CSS variable.
      const gutterElement = editor.codeMirror.getGutterElement();
      (gutterElement as HTMLElement).parentElement!.style.setProperty(
        "--hit-count-gutter-width",
        `-${gutterWidth}`
      );

      let lineNumber = lower;

      doc.eachLine(lower, upper, (lineHandle: any) => {
        lineNumber++;

        const hitCount = hitCountMap?.get(lineNumber) || 0;

        // We use a gradient to indicate the "heat" (the number of hits).
        // This absolute hit count values are relative, per file.
        // Cubed root prevents high hit counts from lumping all other values together.
        const NUM_GRADIENT_COLORS = 3;
        let className = styles.HitsBadge0;
        let index = NUM_GRADIENT_COLORS - 1;
        if (hitCount > 0) {
          if (minHitCount !== maxHitCount) {
            index = Math.min(
              NUM_GRADIENT_COLORS - 1,
              Math.round(
                ((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS
              )
            );
          }
          className = styles[`HitsBadge${index + 1}`];
        }

        if (features.disableUnHitLines) {
          if (hitCount > 0) {
            editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
          } else {
            // If this line wasn't hit any, dim the line number,
            // even if it's a line that's technically reachable.
            editor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
          }
        }

        const markerNode = document.createElement("div");
        markerNode.onclick = () => updateHitCountsMode(isCollapsed ? "show-counts" : "hide-counts");
        markerNode.className = className;
        if (!isCollapsed && hitCount > 0) {
          markerNode.textContent =
            hitCount < 1000 ? `${hitCount}` : `${(hitCount / 1000).toFixed(1)}k`;
        }
        markerNode.title = `${hitCount} hits`;

        doc.setGutterMarker(lineHandle, "hit-markers", markerNode);
      });
    };

    doc.on("change", drawLines);
    doc.on("swapDoc", drawLines);

    drawLines();

    return () => {
      editor.editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers"]);
      resizeBreakpointGutter(editor.editor);

      doc.off("change", drawLines);
      doc.off("swapDoc", drawLines);
    };
  }, [
    editor,
    hitCountMap,
    isCollapsed,
    minHitCount,
    maxHitCount,
    updateHitCountsMode,
    lower,
    upper,
  ]);

  // We're just here for the hooks!
  return null;
}

function hitCountsToMap(hitCounts: HitCount[]): Map<number, number> {
  const hitCountMap: Map<number, number> = new Map();
  hitCounts.forEach(hitCount => {
    const line = hitCount.location.line;
    hitCountMap.set(line, (hitCountMap.get(line) || 0) + hitCount.hits);
  });
  return hitCountMap;
}

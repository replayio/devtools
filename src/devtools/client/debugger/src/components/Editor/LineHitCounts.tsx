import { useMemo, useLayoutEffect, useState } from "react";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { setBreakpointHitCounts } from "../../actions/sources";
import { HitCount, getHitCountsForSelectedSource } from "../../reducers/sources";
import { getSelectedSourceId } from "../../selectors";
import { getHitCountColors } from "../../utils/editor/hit-counts";

import styles from "./LineHitCounts.module.css";

type Props = { cm: any; editorRef: any };

export default function LineHitCountsWrapper(props: Props) {
  const { value } = useFeature("hitCounts");
  const dispatch = useAppDispatch();

  const sourceId = useAppSelector(getSelectedSourceId);
  const hitCounts = useAppSelector(getHitCountsForSelectedSource);
  const hitCountMap = useMemo(
    () => (hitCounts !== null ? hitCountsToMap(hitCounts) : null),
    [hitCounts]
  );

  const hitCountColor = getHitCountColors(hitCounts);
  useLayoutEffect(() => {
    // HACK Make sure we load hit count metadata; normally this is done in response to a mouseover event.
    if (hitCounts === null) {
      dispatch(setBreakpointHitCounts(sourceId, 0));
    }

    let styles = "";
    for (const [
      count,
      { foregroundColor, backgroundColor, textColor, textHoverColor },
    ] of hitCountColor) {
      styles += `
      .cm-s-mozilla .hit-count-${count} .CodeMirror-linenumber {
        color: ${textColor};
      }\n
      .cm-s-mozilla .hit-count-${count}:hover .CodeMirror-linenumber {
        color: ${textHoverColor};
      }\n
      
      .hits-badge-${count} {
        color: ${foregroundColor};
        background-color: ${backgroundColor};
      }\n
      `;
    }
    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [dispatch, sourceId, hitCounts]);

  return value ? <LineHitCounts {...props} /> : null;
}

function LineHitCounts({ cm, editorRef }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const hitCounts = useAppSelector(getHitCountsForSelectedSource);
  const hitCountMap = useMemo(
    () => (hitCounts !== null ? hitCountsToMap(hitCounts) : null),
    [hitCounts]
  );

  useLayoutEffect(() => {
    if (!cm) {
      return;
    }

    const doc = cm.editor.getDoc();
    const drawLines = () => {
      const gutterWidth = isCollapsed ? 4 : 20;
      cm.editor.setOption("gutters", [
        "breakpoints",
        "CodeMirror-linenumbers",
        { className: "hit-markers", style: `width: ${gutterWidth}px;` },
      ]);

      let lineNumber = 0;

      doc.eachLine((lineHandle: any) => {
        lineNumber++;

        const hitCount = hitCountMap?.get(lineNumber) || 0;
        if (hitCount === 0) {
          return;
        }

        const className = styles.HitsBadge;
        const innerHTML = hitCount < 1000 ? `${hitCount}` : `${(hitCount / 1000).toFixed(1)}k`;
        const title = `${hitCount} hits`;

        const markerNode = document.createElement("div");

        if (!isCollapsed) {
          markerNode.innerHTML = innerHTML;
        }

        // Just for quick testing purposes, needs to be moved to LineHitCountsToggle
        markerNode.onclick = () => setIsCollapsed(!isCollapsed);
        markerNode.className = className;
        markerNode.classList.add(`hits-badge-${hitCount}`);
        markerNode.title = title;
        // const { backgroundColor, foregroundColor } = hitCountColor.get(hitCount);
        // markerNode.style.backgroundColor = `var(--hit-count-${hitCount}-background)`;
        // markerNode.style.color = `var(--hit-count-${hitCount}-foreground)`;

        doc.setGutterMarker(lineHandle, "hit-markers", markerNode);
      });
    };

    doc.on("change", drawLines);
    doc.on("swapDoc", drawLines);

    drawLines();

    return () => {
      cm.editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers"]);

      doc.off("change", drawLines);
      doc.off("swapDoc", drawLines);
    };
  }, [cm, hitCountMap, isCollapsed]);

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

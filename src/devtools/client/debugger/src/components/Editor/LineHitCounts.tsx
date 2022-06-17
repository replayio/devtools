import { useMemo, useLayoutEffect } from "react";
import { interpolateLab } from "d3-interpolate";
import { getLuminance } from "polished";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { setBreakpointHitCounts } from "../../actions/sources";
import { HitCount, getHitCountsForSelectedSource } from "../../reducers/sources";
import { getSelectedSourceId } from "../../selectors";

import styles from "./LineHitCounts.module.css";

type Props = { cm: any };

export default function LineHitCountsWrapper(props: Props) {
  const { value } = useFeature("hitCounts");
  return value ? <LineHitCounts {...props} /> : null;
}

function LineHitCounts({ cm }: Props) {
  const sourceId = useAppSelector(getSelectedSourceId);
  const hitCounts = useAppSelector(getHitCountsForSelectedSource);
  const hitCountMap = useMemo(
    () => (hitCounts !== null ? hitCountsToMap(hitCounts) : null),
    [hitCounts]
  );
  const dispatch = useAppDispatch();
  const hitCountColorMap = useMemo(() => {
    const uniqueHitCounts = Array.from(
      new Set(hitCounts ? hitCounts.map(hitCount => hitCount.hits) : [])
    );
    const maxHitCount = Math.max(...uniqueHitCounts);

    return new Map(
      uniqueHitCounts.map(hitCount => [
        hitCount,
        Math.min(1, Math.max(0, Math.cbrt(hitCount) / Math.cbrt(maxHitCount))) || 0,
      ])
    );
  }, [hitCounts]);

  useLayoutEffect(() => {
    // HACK Make sure we load hit count metadata; normally this is done in response to a mouseover event.
    if (hitCounts === null) {
      dispatch(setBreakpointHitCounts(sourceId, 0));
    }
  }, [dispatch, sourceId, hitCounts]);

  useLayoutEffect(() => {
    if (!cm) {
      return;
    }

    const doc = cm.editor.getDoc();
    const drawLines = () => {
      cm.editor.setOption("gutters", [
        "breakpoints",
        "CodeMirror-linenumbers",
        { className: "hit-markers", style: "width: 22px;" },
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
        const lowCountColor = "#a5c5eb";
        const highCountColor = "#e34d91";
        const backgroundColor = interpolateLab(
          lowCountColor,
          highCountColor
        )(hitCountColorMap.get(hitCount) || 0);
        const foregroundColor =
          getLuminance(backgroundColor) > 0.5 ? "rgba(0,0,0,0.97)" : "rgba(255,255,255,.99)";

        markerNode.className = className;
        markerNode.innerHTML = innerHTML;
        markerNode.title = title;
        markerNode.style.backgroundColor = backgroundColor;
        markerNode.style.color = foregroundColor;

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
  }, [cm, hitCountMap, hitCountColorMap]);

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

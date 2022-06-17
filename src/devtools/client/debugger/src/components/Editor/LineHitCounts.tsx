import { useMemo, useLayoutEffect } from "react";
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
      cm.editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers", "hit-markers"]);

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
        markerNode.className = className;
        markerNode.innerHTML = innerHTML;
        markerNode.title = title;

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
  }, [cm, hitCountMap]);

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

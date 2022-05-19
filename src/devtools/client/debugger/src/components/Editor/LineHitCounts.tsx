import { classMethod } from "@babel/types";
import minBy from "lodash/minBy";
import React, { useState, useMemo, useLayoutEffect } from "react";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { prefs, features } from "ui/utils/prefs";

import { getHitCountsForSelectedSource, getSelectedSource } from "../../reducers/sources";

interface LHCProps {
  // make this better!
  cm: any;
}

export const LineHitCounts = ({ cm }: LHCProps) => {
  const [codeHeatMaps, setCodeHeatMaps] = useState(features.codeHeatMaps);
  const indexed = useSelector(selectors.getIsIndexed);
  const hitCounts = useSelector(getHitCountsForSelectedSource);
  const source = useSelector(getSelectedSource);
  const analysisPoints = useSelector(selectors.getPointsForHoveredLineNumber);
  const breakpoints = useSelector(selectors.getBreakpointsList);

  /*
  let analysisPointsCount = useMemo(() => {
    if (hitCounts) {
      const lineHitCounts = minBy(
        hitCounts.filter(hitCount => hitCount.location.line === lastHoveredLineNumber.current),
        b => b.location.column
      );
      return lineHitCounts?.hits;
    } else {
      return analysisPoints?.data.length;
    }
  }, [hitCounts, analysisPoints]);
  */

  useLayoutEffect(() => {
    if (!cm) {
      return;
    }

    const doc = cm.editor.getDoc();
    const drawLines = () => {
      cm.editor.setOption("gutters", ["breakpoints", "CodeMirror-linenumbers", "hit-markers"]);
      doc.eachLine((lineHandle: any) => {
        const markerNode = document.createElement("div");
        markerNode.innerHTML = "25x";
        markerNode.style.zIndex = "0";
        markerNode.style.backgroundColor = "green";
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
  }, [cm]);

  // We're just here for the hooks!
  return null;
};

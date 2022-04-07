import { PointDescription } from "@recordreplay/protocol";
import { isNumber } from "lodash";
import React, { useRef, useState, useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHoveredLineNumberLocation } from "ui/actions/app";
import { KeyModifiers } from "ui/components/KeyModifiers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { getHoveredLineNumberLocation } from "ui/reducers/app";
import { UIState } from "ui/state";
import { AnalysisPayload } from "ui/state/app";
import { prefs, features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/user";
import { getHitCountsForLineNumber, getHitCountsForSelectedSource, getSelectedSource } from "../../reducers/sources";
import StaticTooltip from "./StaticTooltip";

const { runAnalysisOnLine } = require("devtools/client/debugger/src/actions/breakpoints/index");
const { setBreakpointHitCounts } = require("devtools/client/debugger/src/actions/sources");
const {
  updateHoveredLineNumber,
} = require("devtools/client/debugger/src/actions/breakpoints/index");

export const AWESOME_BACKGROUND = `linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF`;

function getTextAndWarning(analysisPoints?: AnalysisPayload, analysisPointsCount?: number) {
  if (analysisPoints?.error) {
    return { text: "10k+ hits", showWarning: false };
  }

  const points = analysisPointsCount || 0;
  const text = `${points} hit${points == 1 ? "" : "s"}`;
  const showWarning = points > prefs.maxHitsDisplayed;
  return { text, showWarning };
}

function Wrapper({
  children,
  showWarning,
  loading,
}: {
  children: ReactNode;
  showWarning?: boolean;
  loading?: boolean;
}) {
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);

  if (showWarning) {
    return (
      <div className="static-tooltip-content space-x-2 bg-red-700">
        <MaterialIcon>warning_amber</MaterialIcon>
        <div>{children}</div>
      </div>
    );
  } else if (showNag) {
    return (
      <div className="static-tooltip-content space-x-2" style={{ background: AWESOME_BACKGROUND }}>
        <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
        <div className="flex flex-col items-start">
          {!loading ? <div className="font-bold">Click to add a print statement</div> : null}
          <div>{children}</div>
        </div>
      </div>
    );
  }

  return <div className="static-tooltip-content bg-gray-700">{children}</div>;
}

const useLineHits = () => {
  const dispatch = useDispatch();
  const { line } = useSelector(getHoveredLineNumberLocation) || { line: null };
  const [codeHeatMaps, setCodeHeatMaps] = useState(features.codeHeatMaps);
  const heatMapHitCounts = useSelector((state: UIState) => getHitCountsForLineNumber(state, line));
  const analysisPoints = useSelector(selectors.getPointsForHoveredLineNumber);
  const source = useSelector(getSelectedSource);
  const lastHoveredLineNumber = useRef<number | null>(null);

  let analysisPointsCount: number | undefined;

  useEffect(() => {
    lastHoveredLineNumber.current = line;
    setTimeout(() => {
      if (line === lastHoveredLineNumber.current) {
        if (codeHeatMaps) {
          dispatch(
            setBreakpointHitCounts(source!.id, line, () => {
              setCodeHeatMaps(false);
              dispatch(runAnalysisOnLine(line));
            })
          );
        } else {
          dispatch(runAnalysisOnLine(line));
        }
      }
    }, 200);
  }, [line]);

  if (codeHeatMaps) {
    analysisPointsCount = heatMapHitCounts?.hits;
  } else {
    analysisPointsCount = analysisPoints?.data.length;
  }
    

  return { hits: analysisPointsCount };
}

export default function LineNumberTooltip({
  editor,
  keyModifiers,
}: {
  editor: any;
  keyModifiers: KeyModifiers;
}) {
  const dispatch = useDispatch();
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const isMetaActive = keyModifiers.meta;
  const indexed = useSelector(selectors.getIsIndexed);
  const analysisPoints = useSelector(selectors.getPointsForHoveredLineNumber);
  const { hits } = useLineHits();

  const setHoveredLineNumber = ({
    lineNumber,
    lineNumberNode,
  }: {
    lineNumber: number;
    lineNumberNode: HTMLElement;
  }) => {
    dispatch(updateHoveredLineNumber(lineNumber));
    setTargetNode(lineNumberNode);
  };
  const clearHoveredLineNumber = () => {
    setTargetNode(null);
    dispatch(setHoveredLineNumberLocation(null));
  };

  useEffect(() => {
    editor.codeMirror.on("lineMouseEnter", setHoveredLineNumber);
    editor.codeMirror.on("lineMouseLeave", clearHoveredLineNumber);
    return () => {
      editor.codeMirror.off("lineMouseEnter", setHoveredLineNumber);
      editor.codeMirror.off("lineMouseLeave", clearHoveredLineNumber);
    };
  }, []);

  useEffect(() => {
    if (hits) {
      trackEvent(
        hits ? "breakpoint.preview_has_hits" : "breakpoint.preview_no_hits"
      );
      trackEvent("breakpoint.preview_hits", { hitsCount: hits || null });
    }
  }, [hits]);

  if (!targetNode || isMetaActive) {
    return null;
  }

  if (!indexed || hits === undefined) {
    return (
      <StaticTooltip targetNode={targetNode}>
        <Wrapper loading>{!indexed ? "Indexing…" : "Loading…"}</Wrapper>
      </StaticTooltip>
    );
  }

  const { text, showWarning } = getTextAndWarning(analysisPoints, hits);
  return (
    <StaticTooltip targetNode={targetNode}>
      <Wrapper showWarning={showWarning}>{text}</Wrapper>
    </StaticTooltip>
  );
}

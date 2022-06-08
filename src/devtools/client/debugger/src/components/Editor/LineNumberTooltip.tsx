import { updateHoveredLineNumber } from "devtools/client/debugger/src/actions/breakpoints/index";
import { setBreakpointHitCounts } from "devtools/client/debugger/src/actions/sources";
import { minBy } from "lodash";
import React, { useRef, useState, useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KeyModifiers } from "ui/components/KeyModifiers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { setHoveredLineNumberLocation } from "ui/reducers/app";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/user";

import { getHitCountsForSelectedSource, getSelectedSource } from "../../reducers/sources";

import StaticTooltip from "./StaticTooltip";

export const AWESOME_BACKGROUND = `linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF`;

function Wrapper({
  children,
  loading,
  showWarning,
}: {
  children: ReactNode;
  loading?: boolean;
  showWarning?: boolean;
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

export default function LineNumberTooltip({
  editor,
  keyModifiers,
}: {
  editor: any;
  keyModifiers: KeyModifiers;
}) {
  const dispatch = useDispatch();
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const lastHoveredLineNumber = useRef<number | null>(null);
  const isMetaActive = keyModifiers.meta;

  const hitCounts = useSelector(getHitCountsForSelectedSource);
  const source = useSelector(getSelectedSource);
  const breakpoints = useSelector(selectors.getBreakpointsList);

  let hits: number | undefined;

  if (lastHoveredLineNumber.current && hitCounts) {
    const lineHitCounts = minBy(
      hitCounts.filter(hitCount => hitCount.location.line === lastHoveredLineNumber.current),
      b => b.location.column
    );
    hits = lineHitCounts?.hits;
  }

  useEffect(() => {
    const setHoveredLineNumber = ({
      lineNumber,
      lineNumberNode,
    }: {
      lineNumber: number;
      lineNumberNode: HTMLElement;
    }) => {
      if (lineNumber !== lastHoveredLineNumber.current) {
        lastHoveredLineNumber.current = lineNumber;
      }
      dispatch(setBreakpointHitCounts(source!.id, lineNumber));
      dispatch(updateHoveredLineNumber(lineNumber));
      setTargetNode(lineNumberNode);
    };
    const clearHoveredLineNumber = () => {
      setTargetNode(null);
      dispatch(setHoveredLineNumberLocation(null));
    };

    editor.codeMirror.on("lineMouseEnter", setHoveredLineNumber);
    editor.codeMirror.on("lineMouseLeave", clearHoveredLineNumber);
    return () => {
      editor.codeMirror.off("lineMouseEnter", setHoveredLineNumber);
      editor.codeMirror.off("lineMouseLeave", clearHoveredLineNumber);
    };
  }, [dispatch, editor.codeMirror, source]);

  useEffect(() => {
    if (hits) {
      trackEvent(hits ? "breakpoint.preview_has_hits" : "breakpoint.preview_no_hits");
      trackEvent("breakpoint.preview_hits", { hitsCount: hits || null });
    }
  }, [hits]);

  if (
    breakpoints.some(
      b =>
        !b.disabled &&
        b.location.sourceId === source?.id &&
        b.location.line === lastHoveredLineNumber.current
    )
  ) {
    return null;
  }

  if (!targetNode || isMetaActive) {
    return null;
  }

  if (!hits) {
    return (
      <StaticTooltip targetNode={targetNode}>
        <Wrapper loading>Loading…</Wrapper>
      </StaticTooltip>
    );
  }

  const count = hits || 0;

  return (
    <StaticTooltip targetNode={targetNode}>
      <Wrapper showWarning={count > 200}>
        {count} hit{count == 1 ? "" : "s"}
      </Wrapper>
    </StaticTooltip>
  );
}

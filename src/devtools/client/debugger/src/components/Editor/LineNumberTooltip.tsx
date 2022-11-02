import React, { ReactNode, Suspense, useContext, useEffect } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getSourceHitCountsSuspense } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { KeyModifiers } from "ui/components/KeyModifiers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { getSelectedSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/user";

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

type Props = {
  keyModifiers: KeyModifiers;
};

function LineNumberTooltipSuspends({ keyModifiers }: Props) {
  const isMetaActive = keyModifiers.meta;
  const source = useAppSelector(getSelectedSource)!;

  const { hoveredLineIndex, hoveredLineNode, visibleLines } = useContext(SourcesContext);

  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const hitCountsForAllLines =
    source && visibleLines
      ? getSourceHitCountsSuspense(replayClient, source.id, visibleLines, focusRange)
      : null;

  let hitsForHoveredLine: number | null = null;
  if (hoveredLineIndex != null && hitCountsForAllLines != null) {
    const hoveredLineNumber = hoveredLineIndex + 1;
    const lineHits = hitCountsForAllLines.get(hoveredLineNumber);
    if (lineHits) {
      // If there are multiple columns with hits for a line, show the first one.
      hitsForHoveredLine = lineHits.count;
    }
  }

  useEffect(() => {
    trackEvent(hitsForHoveredLine ? "breakpoint.preview_has_hits" : "breakpoint.preview_no_hits");
    trackEvent("breakpoint.preview_hits", { hitsCount: hitsForHoveredLine });
  }, [hitsForHoveredLine]);

  if (isMetaActive) {
    return null;
  } else if (hoveredLineIndex === null || hoveredLineNode === null) {
    return null;
  } else if (hitCountsForAllLines == null) {
    return <Loading hoveredLineNode={hoveredLineNode} />;
  } else if (hitsForHoveredLine == null) {
    return null;
  }

  return (
    <StaticTooltip targetNode={hoveredLineNode}>
      <Wrapper showWarning={hitsForHoveredLine! > 200}>
        {hitsForHoveredLine} hit{hitsForHoveredLine == 1 ? "" : "s"}
      </Wrapper>
    </StaticTooltip>
  );
}

function Loading({ hoveredLineNode }: { hoveredLineNode: HTMLElement }) {
  return (
    <StaticTooltip targetNode={hoveredLineNode}>
      <Wrapper loading>Loading…</Wrapper>
    </StaticTooltip>
  );
}

export default function LineNumberTooltip({ keyModifiers }: Props) {
  const { hoveredLineNode } = useContext(SourcesContext);
  if (hoveredLineNode === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading hoveredLineNode={hoveredLineNode} />}>
        <LineNumberTooltipSuspends keyModifiers={keyModifiers} />
      </Suspense>
    </ErrorBoundary>
  );
}

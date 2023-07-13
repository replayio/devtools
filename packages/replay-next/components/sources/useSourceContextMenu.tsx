import assert from "assert";
import { SourceId, TimeStampedPoint } from "@replayio/protocol";
import { unstable_useCacheRefresh as useCacheRefresh, useContext, useTransition } from "react";
import { useImperativeCacheValue } from "suspense";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import {
  COMMENT_TYPE_SOURCE_CODE,
  createTypeDataForSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { findLastHitPoint } from "replay-next/components/sources/utils/findLastHitPoint";
import { findNextHitPoint } from "replay-next/components/sources/utils/findNextHitPoints";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { HitPointStatus, LineHitCounts } from "shared/client/types";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";

export default function useSourceContextMenu({
  lineHitCounts,
  lineNumber,
  sourceId,
  sourceUrl,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  sourceId: SourceId;
  sourceUrl: string | null;
}) {
  const { range: focusRange } = useContext(FocusContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const replayClient = useContext(ReplayClientContext);
  const { accessToken, endpoint, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: currentTime } = useContext(TimelineContext);

  // Don't Suspend during mount; the context menu should show immediately
  // even if we're still fetching hit points
  const { value } = useImperativeCacheValue(
    hitPointsForLocationCache,
    replayClient,
    {
      begin: focusRange ? focusRange.begin.point : "0",
      end: focusRange ? focusRange.end.point : endpoint,
    },
    {
      column: lineHitCounts?.firstBreakableColumnIndex ?? 0,
      line: lineNumber,
      sourceId,
    },
    null
  );

  const [hitPoints, hitPointStatus] = value ?? [null, null];

  const [isPending, startTransition] = useTransition();
  const invalidateCache = useCacheRefresh();

  const addComment = () => {
    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }
      trackEvent("breakpoint.add_comment");

      const typeData = await createTypeDataForSourceCodeComment(
        replayClient,
        sourceId,
        lineNumber,
        0
      );

      await addCommentGraphQL(graphQLClient, accessToken!, recordingId, {
        content: "",
        hasFrames: true,
        isPublished: false,
        point: currentExecutionPoint,
        time: currentTime,
        type: COMMENT_TYPE_SOURCE_CODE,
        typeData,
      });

      invalidateCache();
    });
  };

  const copySourceUri = () => {
    copyToClipboard(sourceUrl!);
  };

  const disableCopySourceUri = sourceUrl == null;

  return useContextMenu(
    <>
      {accessToken !== null && (
        <>
          <ContextMenuItem
            dataTestName="ContextMenuItem-AddComment"
            disabled={isPending}
            onSelect={addComment}
          >
            Add comment to line {lineNumber}
          </ContextMenuItem>
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem disabled={disableCopySourceUri} onSelect={copySourceUri}>
        Copy source URI
      </ContextMenuItem>
      <ContextMenuDivider />
      <StepBackToLineMenuItem
        hitPoints={hitPoints}
        hitPointStatus={hitPointStatus}
        lineNumber={lineNumber}
      />
      <StepForwardToLineMenuItem
        hitPoints={hitPoints}
        hitPointStatus={hitPointStatus}
        lineNumber={lineNumber}
      />
    </>,
    {
      requireClickToShow: true,
      dataTestId: `ContextMenu-Source-${lineNumber}`,
      dataTestName: "ContextMenu-Source",
    }
  );
}

function StepBackToLineMenuItem({
  hitPoints,
  hitPointStatus,
  lineNumber,
}: {
  hitPoints: TimeStampedPoint[] | null;
  hitPointStatus: HitPointStatus | null;
  lineNumber: number;
}) {
  const { executionPoint, update } = useContext(TimelineContext);

  let targetPoint: TimeStampedPoint | null = null;
  if (hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    targetPoint = findLastHitPoint(hitPoints, executionPoint);
  }

  const onSelect = () => {
    assert(targetPoint != null);
    update(targetPoint.time, targetPoint.point, false);
  };

  return (
    <ContextMenuItem disabled={targetPoint == null} onSelect={onSelect}>
      Rewind to line {lineNumber}
    </ContextMenuItem>
  );
}

function StepForwardToLineMenuItem({
  hitPoints,
  hitPointStatus,
  lineNumber,
}: {
  hitPoints: TimeStampedPoint[] | null;
  hitPointStatus: HitPointStatus | null;
  lineNumber: number;
}) {
  const { executionPoint, update } = useContext(TimelineContext);

  let targetPoint: TimeStampedPoint | null = null;
  if (hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    targetPoint = findNextHitPoint(hitPoints, executionPoint);
  }

  const onSelect = () => {
    assert(targetPoint != null);
    update(targetPoint.time, targetPoint.point, false);
  };

  return (
    <ContextMenuItem disabled={targetPoint == null} onSelect={onSelect}>
      Fast forward to line {lineNumber}
    </ContextMenuItem>
  );
}

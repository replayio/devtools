import assert from "assert";
import { SourceId, TimeStampedPoint } from "@replayio/protocol";
import {
  Suspense,
  unstable_useCacheRefresh as useCacheRefresh,
  useContext,
  useTransition,
} from "react";
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
import { LineHitCounts } from "shared/client/types";
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
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const replayClient = useContext(ReplayClientContext);
  const { accessToken, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: currentTime } = useContext(TimelineContext);

  const [isPending, startTransition] = useTransition();
  const invalidateCache = useCacheRefresh();

  const addComment = () => {
    startTransition(async () => {
      if (!currentExecutionPoint) {
        return;
      }

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
      <ContextMenuItem disabled={sourceUrl == null} onSelect={copySourceUri}>
        Copy source URI
      </ContextMenuItem>
      <ContextMenuDivider />
      <Suspense
        fallback={<ContextMenuItem disabled={true}>Rewind to line {lineNumber}</ContextMenuItem>}
      >
        <RewindButton lineHitCounts={lineHitCounts} lineNumber={lineNumber} sourceId={sourceId} />
      </Suspense>{" "}
      <Suspense
        fallback={
          <ContextMenuItem disabled={true}>Fast forward to line {lineNumber}</ContextMenuItem>
        }
      >
        <FastForwardButton
          lineHitCounts={lineHitCounts}
          lineNumber={lineNumber}
          sourceId={sourceId}
        />
      </Suspense>
    </>,
    {
      requireClickToShow: true,
      dataTestId: `ContextMenu-Source-${lineNumber}`,
      dataTestName: "ContextMenu-Source",
    }
  );
}

function FastForwardButton({
  lineHitCounts,
  lineNumber,
  sourceId,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  sourceId: SourceId;
}) {
  const { executionPoint: currentExecutionPoint, time: currentTime, update } = useContext(TimelineContext);

  const [hitPoints, hitPointStatus] = useDeferredHitCounts({
    lineHitCounts,
    lineNumber,
    sourceId,
  });

  let fastForwardToExecutionPoint: TimeStampedPoint | null = null;
  if (currentExecutionPoint && hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    fastForwardToExecutionPoint = findNextHitPoint(hitPoints, { point: currentExecutionPoint, time: currentTime });
  }

  const fastForward = () => {
    assert(fastForwardToExecutionPoint != null);
    assert(lineHitCounts != null);
    update(fastForwardToExecutionPoint.time, fastForwardToExecutionPoint.point, false, {
      sourceId,
      line: lineNumber,
      column: lineHitCounts.firstBreakableColumnIndex,
    });
  };

  return (
    <ContextMenuItem disabled={fastForwardToExecutionPoint == null} onSelect={fastForward}>
      Fast forward to line {lineNumber}
    </ContextMenuItem>
  );
}

function RewindButton({
  lineHitCounts,
  lineNumber,
  sourceId,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  sourceId: SourceId;
}) {
  const { executionPoint: currentExecutionPoint, time: currentTime, update } = useContext(TimelineContext);

  const [hitPoints, hitPointStatus] = useDeferredHitCounts({
    lineHitCounts,
    lineNumber,
    sourceId,
  });

  let rewindToExecutionPoint: TimeStampedPoint | null = null;
  if (currentExecutionPoint && hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    rewindToExecutionPoint = findLastHitPoint(hitPoints, { point: currentExecutionPoint, time: currentTime });
  }

  const rewind = () => {
    assert(rewindToExecutionPoint != null);
    assert(lineHitCounts != null);
    update(rewindToExecutionPoint.time, rewindToExecutionPoint.point, false, {
      sourceId,
      line: lineNumber,
      column: lineHitCounts.firstBreakableColumnIndex,
    });
  };

  return (
    <ContextMenuItem disabled={rewindToExecutionPoint == null} onSelect={rewind}>
      Rewind to line {lineNumber}
    </ContextMenuItem>
  );
}
function useDeferredHitCounts({
  lineHitCounts,
  lineNumber,
  sourceId,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  sourceId: SourceId;
}) {
  const { rangeForSuspense: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const { endpoint } = useContext(SessionContext);

  return hitPointsForLocationCache.read(
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
}

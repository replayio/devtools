import { SourceId } from "@replayio/protocol";
import { unstable_useCacheRefresh as useCacheRefresh, useContext, useTransition } from "react";

import ContextMenuDivider from "bvaughn-architecture-demo/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "bvaughn-architecture-demo/components/context-menu/ContextMenuItem";
import useContextMenu from "bvaughn-architecture-demo/components/context-menu/useContextMenu";
import { copyToClipboard } from "bvaughn-architecture-demo/components/sources/utils/clipboard";
import { GraphQLClientContext } from "bvaughn-architecture-demo/src/contexts/GraphQLClientContext";
import { InspectorContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { addComment as addCommentGraphQL } from "bvaughn-architecture-demo/src/graphql/Comments";
import useLocalStorage from "bvaughn-architecture-demo/src/hooks/useLocalStorage";

export default function useSourceContextMenu({
  firstBreakableColumnIndex,
  lineNumber,
  sourceId,
  sourceUrl,
}: {
  firstBreakableColumnIndex: number | null;
  lineNumber: number;
  sourceId: SourceId;
  sourceUrl: string | null;
}) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: curentTime } = useContext(TimelineContext);

  const togglesLocalStorageKey = `Replay:ShowHitCounts`;
  const [showHitCounts, setShowHitCounts] = useLocalStorage<boolean>(togglesLocalStorageKey, true);

  const [isPending, startTransition] = useTransition();
  const invalidateCache = useCacheRefresh();

  const addComment = () => {
    if (accessToken === null) {
      return;
    }

    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }
      trackEvent("breakpoint.add_comment");

      await addCommentGraphQL(graphQLClient, accessToken, recordingId, {
        content: "",
        hasFrames: true,
        isPublished: false,
        point: currentExecutionPoint,
        sourceLocation: {
          column: firstBreakableColumnIndex != null ? firstBreakableColumnIndex : 0,
          line: lineNumber,
          sourceId,
        },
        time: curentTime,
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
      <ContextMenuItem disabled={isPending} onClick={addComment}>
        Add comment to line {lineNumber}
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem disabled={disableCopySourceUri} onClick={copySourceUri}>
        Copy source URI
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setShowHitCounts(!showHitCounts)}>
        {showHitCounts ? "Hide" : "Show"} hit counts
      </ContextMenuItem>
    </>
  );
}

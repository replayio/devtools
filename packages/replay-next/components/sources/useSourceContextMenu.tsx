import { SourceId } from "@replayio/protocol";
import { unstable_useCacheRefresh as useCacheRefresh, useContext, useTransition } from "react";

import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import {
  COMMENT_TYPE_SOURCE_CODE,
  createTypeDataForSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { addComment as addCommentGraphQL } from "replay-next/src/graphql/Comments";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useSourceContextMenu({
  lineNumber,
  sourceId,
  sourceUrl,
}: {
  lineNumber: number;
  sourceId: SourceId;
  sourceUrl: string | null;
}) {
  const client = useContext(ReplayClientContext);
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId, trackEvent } = useContext(SessionContext);
  const { executionPoint: currentExecutionPoint, time: currentTime } = useContext(TimelineContext);

  const togglesLocalStorageKey = `Replay:ShowHitCounts`;
  const [showHitCounts, setShowHitCounts] = useLocalStorage<boolean>(togglesLocalStorageKey, true);

  const [isPending, startTransition] = useTransition();
  const invalidateCache = useCacheRefresh();

  const addComment = () => {
    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }
      trackEvent("breakpoint.add_comment");

      const typeData = await createTypeDataForSourceCodeComment(client, sourceId, lineNumber, 0);

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
          <ContextMenuItem disabled={isPending} onClick={addComment}>
            Add comment to line {lineNumber}
          </ContextMenuItem>
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem disabled={disableCopySourceUri} onClick={copySourceUri}>
        Copy source URI
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setShowHitCounts(!showHitCounts)}>
        {showHitCounts ? "Hide" : "Show"} hit counts
      </ContextMenuItem>
    </>
  );
}

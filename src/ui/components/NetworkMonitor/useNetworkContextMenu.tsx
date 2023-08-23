import { unstable_useCacheRefresh as useCacheRefresh, useContext, useTransition } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import {
  COMMENT_TYPE_NETWORK_REQUEST,
  createTypeDataForNetworkRequestComment,
} from "replay-next/components/sources/utils/comments";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { addComment as addCommentGraphQL } from "shared/graphql/Comments";
import { setFocusWindowBegin, setFocusWindowEnd } from "ui/actions/timeline";
import useCopyAsCURL from "ui/components/NetworkMonitor/useCopyAsCURL";
import { useAppDispatch } from "ui/setup/hooks";

import { RequestSummary } from "./utils";
import styles from "./NetworkContextMenu.module.css";

export default function useNetworkContextMenu({
  requestSummary,
}: {
  requestSummary: RequestSummary;
}) {
  const graphQLClient = useContext(GraphQLClientContext);
  const { showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();
  const invalidateCache = useCacheRefresh();

  const { copy: copyAsCURL, state } = useCopyAsCURL(requestSummary);

  const beginTime = requestSummary.start!;
  const endTime = requestSummary.end!;

  const setFocusEnd = () => {
    dispatch(setFocusWindowEnd({ time: endTime, sync: true }));
  };

  const setFocusStart = () => {
    dispatch(setFocusWindowBegin({ time: beginTime, sync: true }));
  };

  const addComment = () => {
    startTransition(async () => {
      if (showCommentsPanel !== null) {
        showCommentsPanel();
      }

      const typeData = await createTypeDataForNetworkRequestComment(
        requestSummary.id,
        requestSummary.method,
        requestSummary.name,
        requestSummary.status ?? null,
        beginTime,
        requestSummary.type
      );

      await addCommentGraphQL(graphQLClient, accessToken!, recordingId, {
        content: "",
        hasFrames: true,
        isPublished: false,
        point: requestSummary.triggerPoint?.point,
        time: requestSummary.triggerPoint?.time,
        type: COMMENT_TYPE_NETWORK_REQUEST,
        typeData,
      });

      invalidateCache();
    });
  };

  return useContextMenu(
    <>
      <ContextMenuItem disabled={beginTime == null} onSelect={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={endTime == null} onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
      <ContextMenuDivider />
      {accessToken !== null && (
        <>
          <ContextMenuItem
            dataTestName="ContextMenuItem-AddComment"
            disabled={isPending}
            onSelect={addComment}
          >
            <>
              <Icon className={styles.CommentIcon} type="comment" />
              Add comment
            </>
          </ContextMenuItem>
        </>
      )}
      <ContextMenuItem disabled={state !== "ready"} onSelect={copyAsCURL}>
        <>
          <Icon type="copy" />
          Copy as CURL
        </>
      </ContextMenuItem>
    </>,
    {
      dataTestName: "ContextMenu-NetworkRequest",
    }
  );
}

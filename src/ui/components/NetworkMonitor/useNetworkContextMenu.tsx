import { useContext, useTransition } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { createNetworkRequestComment } from "ui/actions/comments";
import { requestFocusWindow } from "ui/actions/timeline";
import useCopyAsCURL from "ui/components/NetworkMonitor/useCopyAsCURL";
import { useAppDispatch } from "ui/setup/hooks";

import { RequestSummary } from "./utils";
import styles from "./NetworkContextMenu.module.css";

export default function useNetworkContextMenu({
  requestSummary,
}: {
  requestSummary: RequestSummary;
}) {
  const { accessToken, recordingId } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const [isPending, startTransition] = useTransition();

  const { copy: copyAsCURL, state } = useCopyAsCURL(requestSummary);

  const beginTime = requestSummary.start!;
  const endTime = requestSummary.end!;

  const setFocusEnd = () => {
    dispatch(requestFocusWindow({ end: { time: endTime } }));
  };

  const setFocusStart = () => {
    dispatch(requestFocusWindow({ begin: { time: beginTime } }));
  };

  const addComment = () => {
    startTransition(async () => {
      dispatch(createNetworkRequestComment(requestSummary, recordingId));
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
      {copyAsCURL && (
        <ContextMenuItem disabled={state !== "ready"} onSelect={copyAsCURL}>
          <>
            <Icon type="copy" />
            Copy as CURL
          </>
        </ContextMenuItem>
      )}
    </>,
    {
      dataTestName: "ContextMenu-NetworkRequest",
    }
  );
}

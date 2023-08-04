import { SerializedEditorState } from "lexical";
import { ReactNode, useContext } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import {
  setFocusWindowBeginTime_TODO_FE_1779,
  setFocusWindowEndTime_TODO_FE_1779,
} from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import type { Remark } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";

import { useConfirm } from "../shared/Confirm";

export default function useCommentContextMenu({
  deleteRemark,
  editRemark,
  remark,
  saveRemark,
  type,
}: {
  deleteRemark: () => void;
  editRemark: () => void;
  remark: Remark;
  saveRemark: (serializedEditorState: SerializedEditorState) => void;
  type: "comment" | "reply";
}) {
  const dispatch = useAppDispatch();
  const { currentUserInfo } = useContext(SessionContext);

  const isCurrentUserAuthor = currentUserInfo?.id === remark.user?.id;

  const { confirmDestructive } = useConfirm();

  const publishRemark = () => {
    saveRemark(JSON.parse(remark.content));
  };

  const confirmDelete = () => {
    const deleteDescription =
      type === "comment"
        ? "This will delete this comment and its replies."
        : "You're about to delete a comment.";

    confirmDestructive({
      acceptLabel: "Delete comment",
      dataTestName: "ConfirmDialog-DeleteComment",
      description: `${deleteDescription}`,
      message: "Are you sure?",
    }).then(async confirmed => {
      if (!confirmed) {
        return;
      }

      trackEvent("comments.delete");

      await deleteRemark();
    });
  };

  const setFocusEnd = () => {
    dispatch(setFocusWindowEndTime_TODO_FE_1779(remark.time, true));
  };

  const setFocusStart = () => {
    dispatch(setFocusWindowBeginTime_TODO_FE_1779(remark.time!, true));
  };

  const contextMenuItems: ReactNode[] = [];
  if (isCurrentUserAuthor) {
    contextMenuItems.push(
      <ContextMenuItem dataTestName="ContextMenuItem-EditComment" key="edit" onSelect={editRemark}>
        Edit comment
      </ContextMenuItem>
    );
    contextMenuItems.push(
      <ContextMenuItem
        dataTestName="ContextMenuItem-DeleteComment"
        key="delete"
        onSelect={confirmDelete}
      >
        {type === "comment" ? "Delete comment and replies" : "Delete comment"}
      </ContextMenuItem>
    );
  }
  if (!remark.isPublished) {
    contextMenuItems.push(
      <ContextMenuItem key="publish" onSelect={publishRemark}>
        Publish comment
      </ContextMenuItem>
    );
  }
  if (contextMenuItems.length > 0) {
    contextMenuItems.push(<ContextMenuDivider key="divider" />);
  }

  contextMenuItems.push(
    <ContextMenuItem key="focusStart" onSelect={setFocusStart}>
      <>
        <Icon type="set-focus-start" />
        Set focus start
      </>
    </ContextMenuItem>
  );

  contextMenuItems.push(
    <ContextMenuItem key="focusEnd" onSelect={setFocusEnd}>
      <>
        <Icon type="set-focus-end" />
        Set focus end
      </>
    </ContextMenuItem>
  );

  return useContextMenu(contextMenuItems, {
    dataTestId: `ContextMenu-Comment-${remark.id}`,
    dataTestName: "ContextMenu-Comment",
  });
}

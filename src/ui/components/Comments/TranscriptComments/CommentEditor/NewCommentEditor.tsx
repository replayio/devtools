import React from "react";
import { connect, ConnectedProps, useDispatch } from "react-redux";

import { Comment, Reply } from "ui/state/comments";
import CommentEditor, { PERSIST_COMMENT_DEBOUNCE_DELAY } from "./CommentEditor";
import { useCommentsLocalStorage } from "./useCommentsLocalStorage";
import debounce from "lodash/debounce";
import { CommentData } from "../types";
import { updatePendingCommentContent } from "ui/actions/comments";

interface NewCommentEditorProps {
  data: CommentData;
  onSubmit: (data: CommentData, inputValue: string) => void;
}

function NewCommentEditor({ onSubmit, data }: NewCommentEditorProps) {
  const commentsLocalStorage = useCommentsLocalStorage(
    data.type === "new_reply"
      ? {
          type: "reply",
          parentId: data.comment.parentId,
        }
      : "video"
  );
  const dispatch = useDispatch();

  return (
    <CommentEditor
      editable={true}
      comment={data.comment}
      handleSubmit={inputValue => onSubmit(data, inputValue)}
      onUpdate={debounce(({ editor }) => {
        dispatch(updatePendingCommentContent(editor.getJSON()));
      }, PERSIST_COMMENT_DEBOUNCE_DELAY)}
      handleCancel={() => commentsLocalStorage.clear()}
    />
  );
}

export default NewCommentEditor;

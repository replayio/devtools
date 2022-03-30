import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { Comment, Reply } from "ui/state/comments";
import CommentEditor, { PERSIST_COMM_DEBOUNCE_DELAY } from "./CommentEditor";
import { useCommentsLocalStorage } from "./useCommentsLocalStorage";
import debounce from "lodash/debounce";
import { CommentData } from "../types";

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

  return (
    <CommentEditor
      editable={true}
      comment={data.comment}
      handleSubmit={inputValue => {
        onSubmit(data, inputValue);
        commentsLocalStorage.clear();
      }}
      onCreate={({ editor }) => {
        const storedComment = commentsLocalStorage.get();
        editor.commands.setContent(storedComment ? JSON.parse(storedComment) : null);
      }}
      onUpdate={debounce(({ editor }) => {
        commentsLocalStorage.set(JSON.stringify(editor.getJSON()));
      }, PERSIST_COMM_DEBOUNCE_DELAY)}
      handleCancel={() => commentsLocalStorage.clear()}
    />
  );
}

export default NewCommentEditor;

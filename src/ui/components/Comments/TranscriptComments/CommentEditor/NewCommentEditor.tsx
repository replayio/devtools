import React from "react";

import CommentEditor, { PERSIST_COMMENT_DEBOUNCE_DELAY } from "./CommentEditor";
import debounce from "lodash/debounce";
import { CommentData } from "../types";
import { updatePendingCommentContent } from "ui/actions/comments";
import { useDispatch } from "react-redux";

interface NewCommentEditorProps {
  data: CommentData;
  onSubmit: (data: CommentData, inputValue: string) => void;
}

function NewCommentEditor({ onSubmit, data }: NewCommentEditorProps) {
  const dispatch = useDispatch();

  return (
    <CommentEditor
      editable={true}
      comment={data.comment}
      handleSubmit={inputValue => onSubmit(data, inputValue)}
      onUpdate={debounce(({ editor }) => {
        dispatch(updatePendingCommentContent(editor.getJSON()));
      }, PERSIST_COMMENT_DEBOUNCE_DELAY)}
    />
  );
}

export default NewCommentEditor;

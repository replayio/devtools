import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import CommentEditor, { PERSIST_COMM_DEBOUNCE_DELAY } from "./CommentEditor";
import { useGetUserId } from "ui/hooks/users";
import { useCommentsLocalStorage } from "./useCommentsLocalStorage";
import debounce from "lodash/debounce";
import { CommentData } from "../types";

const LoomComment = connect(null, { setModal: actions.setModal })(
  ({ setModal, loom }: { loom: string; setModal: typeof actions.setModal }) => {
    function showLoom() {
      setModal("loom", { loom });
    }

    return (
      <div onClick={showLoom}>
        <img src={`https://cdn.loom.com/sessions/thumbnails/${loom}-with-play.jpg`} />
      </div>
    );
  }
);

type ExistingCommentEditorProps = PropsFromRedux & {
  editable: boolean;
  data: CommentData;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onSubmit: (data: CommentData, inputValue: string) => void;
};

function ExistingCommentEditor({
  editable,
  isEditing,
  setIsEditing,
  data,
  onSubmit,
}: ExistingCommentEditorProps) {
  const { comment } = data;
  const { userId } = useGetUserId();
  const commentsLocalStorage = useCommentsLocalStorage({
    type: "existing",
    commentId: comment.id,
  });

  const loom = comment.content.match(/loom\.com\/share\/(\S*?)(\"|\?)/)?.[1];
  if (loom) {
    return <LoomComment loom={loom} />;
  }

  return (
    <div
      onDoubleClick={() => {
        if (comment.user.id === userId) {
          setIsEditing(true);
        }
      }}
    >
      <CommentEditor
        editable={editable && isEditing}
        comment={comment}
        handleSubmit={inputValue => {
          commentsLocalStorage.clear();
          setIsEditing(false);
          onSubmit(data, inputValue);
        }}
        onCreate={({ editor }) => {
          const storedComment = commentsLocalStorage.get();
          if (storedComment) {
            editor.commands.setContent(JSON.parse(storedComment));
          }
        }}
        onUpdate={debounce(({ editor }) => {
          commentsLocalStorage.set(JSON.stringify(editor.getJSON()));
        }, PERSIST_COMM_DEBOUNCE_DELAY)}
        handleCancel={() => commentsLocalStorage.clear()}
      />
    </div>
  );
}

const connector = connect(null, {
  clearPendingComment: actions.clearPendingComment,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);

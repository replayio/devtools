import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import CommentEditor, { PERSIST_COMM_DEBOUNCE_DELAY } from "./CommentEditor";
import { Comment } from "ui/state/comments";
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
  onSubmit: (data: CommentData, inputValue: string) => void;
};

function ExistingCommentEditor({ editable, editItem, data, onSubmit }: ExistingCommentEditorProps) {
  const { comment, type } = data;
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
          editItem(comment);
        }
      }}
    >
      <CommentEditor
        editable={editable}
        comment={comment}
        handleSubmit={inputValue => {
          commentsLocalStorage.clear();
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
  editItem: actions.editItem,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ExistingCommentEditor);

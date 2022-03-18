import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import CommentEditor, { PERSIST_COMM_DEBOUNCE_DELAY } from "./CommentEditor";
import { Comment, Reply } from "ui/state/comments";
import { useGetUserId } from "ui/hooks/users";
import { useCommentsLocalStorage } from "./useCommentsLocalStorage";
import debounce from "lodash/debounce";

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
  comment: Comment | Reply;
  editable: boolean;
  type: "comment" | "reply";
};

function ExistingCommentEditor({
  comment,
  clearPendingComment,
  editable,
  editItem,
  type,
}: ExistingCommentEditorProps) {
  const { userId } = useGetUserId();
  const updateComment = hooks.useUpdateComment();
  const updateCommentReply = hooks.useUpdateCommentReply();
  const commentsLocalStorage = useCommentsLocalStorage({
    type: "existing",
    commentId: comment.id,
  });

  const handleSubmit = (inputValue: string) => {
    if (type === "comment") {
      updateComment(comment.id, inputValue, (comment as Comment).position);
    } else if (type === "reply") {
      updateCommentReply(comment.id, inputValue);
    }
    clearPendingComment();
  };

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
        handleSubmit={handleSubmit}
        onCreate={({ editor }) => {
          const storedComment = commentsLocalStorage.get();
          editor.commands.setContent(storedComment ? JSON.parse(storedComment) : null);
        }}
        onUpdate={debounce(({ editor }) => {
          commentsLocalStorage.set(JSON.stringify(editor.getJSON()));
        }, PERSIST_COMM_DEBOUNCE_DELAY)}
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

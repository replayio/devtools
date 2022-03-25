import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { actions } from "ui/actions";
import { Comment, Reply } from "ui/state/comments";
import CommentEditor, { PERSIST_COMM_DEBOUNCE_DELAY } from "./CommentEditor";
import useAuth0 from "ui/utils/useAuth0";
import { useCommentsLocalStorage } from "./useCommentsLocalStorage";
import debounce from "lodash/debounce";

interface NewCommentEditorProps extends PropsFromRedux {
  data:
    | {
        type: "new_reply";
        comment: Reply;
      }
    | {
        type: "new_comment";
        comment: Comment;
      };
}

function NewCommentEditor({ clearPendingComment, data, setModal }: NewCommentEditorProps) {
  const { isAuthenticated } = useAuth0();
  const addComment = hooks.useAddComment();
  const addCommentReply = hooks.useAddCommentReply();
  const commentsLocalStorage = useCommentsLocalStorage(
    data.type === "new_reply"
      ? {
          type: "reply",
          parentId: data.comment.parentId,
        }
      : "video"
  );

  const handleSubmit = (inputValue: string) => {
    if (!isAuthenticated) {
      setModal("login");
      return;
    }

    if (data.type == "new_reply") {
      handleReplySave(data.comment, inputValue);
    } else {
      handleNewSave(data.comment, inputValue);
    }

    commentsLocalStorage.clear();

    clearPendingComment();
  };

  const handleReplySave = async (comment: Reply, inputValue: string) => {
    const reply = {
      ...comment,
      content: inputValue,
    };

    addCommentReply(reply);
  };

  const handleNewSave = async (comment: Comment, inputValue: string) => {
    const newComment = {
      ...comment,
      content: inputValue,
    };

    const result = await addComment(newComment);
    console.log(result);
  };

  return (
    <CommentEditor
      editable={true}
      comment={data.comment}
      handleSubmit={handleSubmit}
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

const connector = connect(null, {
  clearPendingComment: actions.clearPendingComment,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewCommentEditor);

import { connect, ConnectedProps } from "react-redux";
import { useEffect } from "react";

import "./CommentTool.css";

import { actions } from "ui/actions";
import { PendingEditComment, PendingNewComment } from "ui/state/comments";

const mouseEventCanvasPosition = (e: MouseEvent) => {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (e.clientX - bounds.left) / scale,
    y: (e.clientY - bounds.top) / scale,
  };
};

interface CommentToolProps extends PropsFromRedux {
  pendingComment:
    | {
        type: "new_comment";
        comment: PendingNewComment;
      }
    | {
        type: "edit_comment";
        comment: PendingEditComment;
      };
}

function CommentTool({ pendingComment, setPendingComment, setCommentPointer }: CommentToolProps) {
  const addListeners = () => {
    setCommentPointer(true);
    const videoNode = document.getElementById("video");

    if (videoNode) {
      videoNode.classList.add("location-marker");
      videoNode.addEventListener("mouseup", onClickInCanvas);
    }
  };
  const removeListeners = () => {
    setCommentPointer(false);
    const videoNode = document.getElementById("video");

    if (videoNode) {
      videoNode.classList.remove("location-marker");
      videoNode.removeEventListener("mouseup", onClickInCanvas);
    }
  };
  const onClickInCanvas = async (e: MouseEvent) => {
    if (e.target !== document.querySelector("canvas#graphics") || !pendingComment) {
      return;
    }

    const newComment = { ...pendingComment };
    newComment.comment.position = mouseEventCanvasPosition(e);

    setPendingComment(newComment);
  };

  useEffect(() => {
    addListeners();
    return () => removeListeners();
  }, []);

  return null;
}

const connector = connect(null, {
  setPendingComment: actions.setPendingComment,
  setCommentPointer: actions.setCommentPointer,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);

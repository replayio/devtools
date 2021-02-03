import { connect, ConnectedProps } from "react-redux";
import { useEffect } from "react";
import "./CommentTool.css";

import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

const mouseEventCanvasPosition = (e: MouseEvent) => {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();
  if (
    e.clientX < bounds.left ||
    e.clientX > bounds.right ||
    e.clientY < bounds.top ||
    e.clientY > bounds.bottom
  ) {
    // Not in the canvas.
    return null;
  }

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (e.clientX - bounds.left) / scale,
    y: (e.clientY - bounds.top) / scale,
  };
};

function CommentTool({
  viewMode,
  comment,
  setPendingComment,
  setSelectedPanel,
  setCommentPointer,
}: PropsFromRedux) {
  const addListeners = () => {
    setCommentPointer(true);
    document.getElementById("video")!.classList.add("location-marker");
    document.getElementById("video")!.addEventListener("mouseup", onClickInCanvas);
  };
  const removeListeners = () => {
    setCommentPointer(false);
    document.getElementById("video")!.classList.remove("location-marker");
    document.getElementById("video")!.removeEventListener("mouseup", onClickInCanvas);
  };
  const onClickInCanvas = async (e: MouseEvent) => {
    if (e.target !== document.querySelector("canvas#graphics")) {
      return;
    }

    if (viewMode === "dev") {
      setSelectedPanel("comments");
    }

    setPendingComment({ ...comment, position: mouseEventCanvasPosition(e) });
  };

  useEffect(() => {
    addListeners();
    return () => removeListeners();
  }, []);

  return null;
}

const connector = connect(
  (state: UIState) => ({
    viewMode: selectors.getViewMode(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
    setCommentPointer: actions.setCommentPointer,
  }
);
type PropsFromParent = {
  comment: any;
};
type PropsFromRedux = ConnectedProps<typeof connector> & PropsFromParent;

export default connector(CommentTool);

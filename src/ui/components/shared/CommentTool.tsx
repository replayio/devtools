import { connect, ConnectedProps } from "react-redux";
import React, { useEffect } from "react";
import { getDevicePixelRatio } from "protocol/graphics";
import { ThreadFront } from "protocol/thread";
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
  currentTime,
  recordingId,
  viewMode,
  pendingComment,
  comment,
  setActiveComment,
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

    // setPosition(mouseEventCanvasPosition(e));
    if (pendingComment) {
      console.log("pendingComment");
      setPendingComment({ ...comment, position: mouseEventCanvasPosition(e) });
    } else {
      const newActiveComment = {
        ...comment,
        position: JSON.stringify(mouseEventCanvasPosition(e)),
      };
      console.log("activeComment", newActiveComment);
      setActiveComment(newActiveComment);
    }

    // const pendingComment = {
    //   content: "",
    //   recording_id: recordingId,
    //   time: currentTime,
    //   point: ThreadFront.currentPoint,
    //   has_frames: ThreadFront.currentPointHasFrames,
    //   position: mouseEventCanvasPosition(e),
    // };

    // setPendingComment({ ...pendingComment, position: mouseEventCanvasPosition(e) });
  };

  useEffect(() => {
    addListeners();
    return () => removeListeners();
  }, []);

  return null;
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
    setCommentPointer: actions.setCommentPointer,
    setActiveComment: actions.setActiveComment,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);

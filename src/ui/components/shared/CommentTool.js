import { connect } from "react-redux";
import React from "react";
import { getDevicePixelRatio } from "protocol/graphics";
import { ThreadFront } from "protocol/thread";
import "./CommentTool.css";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

const mouseEventCanvasPosition = e => {
  const canvas = document.getElementById("graphics");
  const bounds = canvas.getBoundingClientRect();
  if (
    e.clientX < bounds.left ||
    e.clientX > bounds.right ||
    e.clientY < bounds.top ||
    e.clientY > bounds.bottom
  ) {
    // Not in the canvas.
    return null;
  }

  const scale = bounds.width / canvas.offsetWidth;
  const pixelRatio = getDevicePixelRatio();
  if (!pixelRatio) {
    return null;
  }

  return {
    x: (e.clientX - bounds.left) / scale / pixelRatio,
    y: (e.clientY - bounds.top) / scale / pixelRatio,
  };
};

function CommentTool({
  currentTime,
  recordingId,
  viewMode,
  setPendingComment,
  setSelectedPanel,
  setCommentPointer,
}) {
  const addListeners = () => {
    setCommentPointer(true);
    console.log("add");
    document.getElementById("video").classList.add("location-marker");
    document.getElementById("video").addEventListener("mouseup", onClickInCanvas);
  };
  const removeListeners = () => {
    setCommentPointer(false);
    console.log("remove");
    document.getElementById("video").classList.remove("location-marker");
    document.getElementById("video").removeEventListener("mouseup", onClickInCanvas);
  };

  const onClickInCanvas = async e => {
    removeListeners();
    console.log("onClick", { e }, e.target);

    if (e.target !== document.querySelector(".canvas-overlay")) {
      console.log("setting pending");
      return;
    }

    if (viewMode === "dev") {
      setSelectedPanel("comments");
    }

    const pendingComment = {
      content: "",
      recording_id: recordingId,
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
      position: JSON.stringify(mouseEventCanvasPosition(e)),
    };

    console.log("setting pending");
    setPendingComment(pendingComment);
  };

  return (
    <button className="comment-tool" onClick={addListeners}>
      Comment Tool
    </button>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
    setCommentPointer: actions.setCommentPointer,
  }
)(CommentTool);

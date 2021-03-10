import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { installObserver } from "../../protocol/graphics";
import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";

function Video({ togglePlayback, isNodePickerActive, commentPointer, pendingComment }) {
  useEffect(() => {
    installObserver();
  }, []);

  // This is intentionally mousedown. Otherwise, the NodePicker's mouseup callback fires
  // first. This updates the isNodePickerActive value and makes it look like the node picker is
  // inactive when we check it here.

  // We make it so that you can't resume playback by clicking on the video if you have an
  // open comment editor.
  const onMouseDown = () => {
    if (isNodePickerActive || commentPointer || pendingComment) {
      return;
    }

    togglePlayback();
  };

  return (
    <div id="video">
      <canvas id="graphics" onMouseDown={onMouseDown} />
      <CommentsOverlay />
      <div id="highlighter-root"></div>
    </div>
  );
}

export default connect(
  state => ({
    pendingComment: selectors.getPendingComment(state),
    isNodePickerActive: selectors.getIsNodePickerActive(state),
    commentPointer: selectors.getCommentPointer(state),
  }),
  {
    togglePlayback: actions.togglePlayback,
    clearPendingComment: actions.clearPendingComment,
  }
)(Video);

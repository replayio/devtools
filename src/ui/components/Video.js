import React, { useEffect } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { installObserver } from "../../protocol/graphics";
import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";

import { features } from "ui/utils/prefs";

function Video({ togglePlayback, isNodePickerActive, commentPointer }) {
  useEffect(() => {
    installObserver();
  }, []);

  // This is intentionally mousedown. Otherwise, the NodePicker's mouseup callback fires
  // first. This updates the isNodePickerActive value and makes it look like the node picker is
  // inactive when we check it here.
  const onMouseDown = () => {
    if (isNodePickerActive || commentPointer) {
      return;
    }

    togglePlayback();
  };

  return (
    <div id="video" onMouseDown={onMouseDown}>
      {features.videoComments ? <CommentsOverlay /> : null}
      <canvas id="graphics"></canvas>
      <div id="highlighter-root"></div>
    </div>
  );
}

export default connect(
  state => ({
    isNodePickerActive: selectors.getIsNodePickerActive(state),
    commentPointer: selectors.getCommentPointer(state),
  }),
  {
    togglePlayback: actions.togglePlayback,
  }
)(Video);

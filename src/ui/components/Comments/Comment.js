import ReactDOM from "react-dom";
import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import { selectors } from "../../reducers";
import { actions } from "../../actions";
import { getPixelOffset, getLeftOffset } from "../../utils/timeline";
import CloseButton from "devtools/client/debugger/src/components/shared/Button/CloseButton";

class Comment extends React.Component {
  state = {
    editing: false,
  };

  onDescriptionChange = e => {
    const { comment, updateComment } = this.props;
    if (e.charCode == "13") {
      this.setState({ editing: false });
      updateComment({ ...comment, contents: e.target.value });
    }
  };

  removeComment = () => {
    const { removeComment, comment } = this.props;
    removeComment(comment);
  };

  render() {
    const { comment, zoomRegion, index, timelineDimensions, showComment } = this.props;
    const { editing, description } = this.state;
    const offset = getPixelOffset({
      time: comment.time,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
    });

    const leftOffset = getLeftOffset({
      time: comment.time,
      overlayWidth: timelineDimensions.width,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    if (!comment.visible) {
      return (
        <div
          className="comment-marker"
          key={comment.id}
          style={{
            left: `calc(${leftOffset}%)`,
          }}
          onClick={() => showComment(comment)}
        ></div>
      );
    }

    return (
      <div
        className={classnames("comment", {})}
        key={comment.id}
        style={{
          left: `${leftOffset}%`,
          zIndex: `${index + 100}`,
        }}
      >
        <div className="comment-body">
          <div className="comment-avatar"></div>
          <div className="comment-content">
            <div className="comment-header">
              <div className="actions">
                <CloseButton handleClick={this.removeComment} />
              </div>
            </div>
            <div className="comment-description">
              {editing || comment.contents == "" ? (
                <textarea onKeyPress={this.onDescriptionChange} defaultValue={comment.contents} />
              ) : (
                <div onDoubleClick={() => this.setState({ editing: true })}>{comment.contents}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    showComment: actions.showComment,
    updateComment: actions.updateComment,
    removeComment: actions.removeComment,
  }
)(Comment);

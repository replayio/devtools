import React from "react";
import ReactDOM from "react-dom";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

import "./EventsTimeline.css";

function EventsTimeline({ comments }) {
  console.log("yo yo", comments);
  return (
    <div className="events-timeline">
      <div>
        {sortBy(comments, comment => comment.time).map(comment => (
          <div className="event ">
            <div className="img rxjs"></div>
            <div className="label">{comment.contents}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    // timelineDimensions: selectors.getTimelineDimensions(state),
    // zoomRegion: selectors.getZoomRegion(state),
    comments: selectors.getComments(state),
  }),
  {
    // showComment: actions.showComment,
    // updateComment: actions.updateComment,
    // removeComment: actions.removeComment,
    // createComment: actions.createComment,
  }
)(EventsTimeline);

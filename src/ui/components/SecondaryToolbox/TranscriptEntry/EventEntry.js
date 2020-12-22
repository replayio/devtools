import React from "react";
import classnames from "classnames";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

function EventEntry({ entry, currentTime, index, seek }) {
  const seekToEvent = () => {
    const { point, time } = entry;
    seek(point, time, false);
  };

  return (
    <div
      onClick={seekToEvent}
      className={classnames("event", {
        selected: currentTime === entry.time,
      })}
      key={index}
    >
      <div className="img event-click" />
      <div className="item-label">Mouse Click</div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
  }),
  { seek: actions.seek }
)(EventEntry);

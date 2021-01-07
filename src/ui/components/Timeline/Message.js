import React from "react";

import { LocalizationHelper } from "devtools/shared/l10n";
import { getPixelOffset, getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";
import { actions } from "../../actions";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");
const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

const onMarkerClick = e => {
  e.preventDefault();
  e.stopPropagation();
};

// Don't change this haphazardly. This marker is intentionally 11px x 11px, so that it
// can be center aligned perfectly with a 1px timeline scrubber line. This means that
// it can also center aligned with other elements so long as those other elements have
// an odd px measurement on the relevant dimension (height/width).

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
export function Marker({ message, onClick = onMarkerClick }) {
  // The stroke path element here has `pointer-events: none` enabled, so that it defers the event
  // handling to the fill path element. Without that property, we'd have to set the event handlers
  // on the stroke path element as well.
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        className="fill"
        cx="5.5"
        cy="5.5"
        r="5.5"
        fill="black"
        onClick={e => onClick(e, message)}
      />
      {/* <circle cx="5.5" cy="5.5" r="4.5" stroke="black" strokeWidth="2" /> */}
      <circle className="stroke" cx="5.5" cy="5.5" r="5" stroke="black" strokeWidth="0" />
    </svg>
  );
}

export function MessagePreview({ message, overlayWidth, zoomRegion }) {
  return (
    <a
      tabIndex={0}
      className={classnames("message message-preview")}
      style={{
        left: `${getLeftOffset({
          time: message.time,
          overlayWidth,
          zoom: zoomRegion,
        })}%`,
      }}
    >
      <Marker />
    </a>
  );
}

class Message extends React.Component {
  render() {
    const {
      message,
      currentTime,
      hoveredMessageId,
      zoomRegion,
      overlayWidth,
      onClick,
      onMouseEnter,
      onMouseLeave,
      setHoveredPoint,
    } = this.props;

    const handleMouseEnter = e => {
      const hoveredPoint = {
        target: "timeline",
        point: message.executionPoint,
        time: message.executionPointTime,
        location: message.frame,
      };
      onMouseEnter(e);
      setHoveredPoint(hoveredPoint);
    };
    const handleMouseLeave = e => {
      onMouseLeave(e);
      setHoveredPoint(null);
    };

    const offset = getPixelOffset({
      time: message.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    // A marker is highlighted if its corresponding message is hovered on
    // in the console
    const isHighlighted = hoveredMessageId == message.id;
    const isPauseLocation = message.executionPointTime === currentTime;

    let frameLocation = "";
    if (message.frame) {
      const { source, line, column } = message.frame;
      const filename = source.split("/").pop();
      frameLocation = `${filename}:${line}`;
      if (column > 100) {
        frameLocation += `:${column}`;
      }
    }

    return (
      <a
        tabIndex={0}
        className={classnames("message", {
          highlighted: isHighlighted,
          paused: isPauseLocation,
        })}
        style={{
          left: `${getLeftOffset({
            time: message.executionPointTime,
            overlayWidth,
            zoom: zoomRegion,
          })}%`,
        }}
        title={getFormatStr("jumpMessage2", frameLocation)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Marker message={message} onClick={onClick} />
      </a>
    );
  }
}

export default connect(null, {
  setHoveredPoint: actions.setHoveredPoint,
})(Message);

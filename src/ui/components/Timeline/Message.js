import React from "react";

import { LocalizationHelper } from "devtools/shared/l10n";
import { getPixelOffset, getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";
import { actions } from "../../actions";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import "./Message.css";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");
const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

// Don't change this haphazardly. This marker is intentionally 11px x 11px, so that it
// can be center aligned perfectly with a 1px timeline scrubber line. This means that
// it can also center aligned with other elements so long as those other elements have
// an odd px measurement on the relevant dimension (height/width).

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
export function Marker() {
  // The stroke path element here has `pointer-events: none` enabled, so that it defers the event
  // handling to the fill path element. Without that property, we'd have to set the event handlers
  // on the stroke path element as well.
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="fill" cx="5.5" cy="5.5" r="5.5" fill="black" />
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

function getIsSecondaryHighlighted(hoveredPoint, message) {
  if (!message?.frame || !hoveredPoint?.location) {
    return false;
  }

  const keyOne = getLocationKey(hoveredPoint.location);
  const keyTwo = getLocationKey(message.frame);
  return keyOne == keyTwo;
}

class Message extends React.Component {
  shouldComponentUpdate(nextProps) {
    const { hoveredPoint, message } = this.props;

    const hoveredPointChanged = hoveredPoint !== nextProps.hoveredPoint;
    const isHighlighted =
      hoveredPoint?.point == message.executionPoint ||
      getIsSecondaryHighlighted(hoveredPoint, message);
    const willBeHighlighted =
      nextProps.hoveredPoint?.point == message.executionPoint ||
      getIsSecondaryHighlighted(nextProps.hoveredPoint, message);

    if (hoveredPointChanged && !isHighlighted && !willBeHighlighted) {
      return false;
    }

    return true;
  }

  render() {
    const {
      message,
      currentTime,
      hoveredPoint,
      zoomRegion,
      overlayWidth,
      setHoveredPoint,
      seek,
    } = this.props;

    const onClick = e => {
      e.preventDefault();
      e.stopPropagation();

      const { executionPoint, executionPointTime, executionPointHasFrames, pauseId } = message;
      seek(executionPoint, executionPointTime, executionPointHasFrames, pauseId);
    };
    const onMouseLeave = () => setHoveredPoint(null);
    const onMouseEnter = () => {
      const hoveredPoint = {
        target: "timeline",
        point: message.executionPoint,
        time: message.executionPointTime,
        location: message.frame,
      };
      setHoveredPoint(hoveredPoint);
    };

    const offset = getPixelOffset({
      time: message.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    const isPrimaryHighlighted = hoveredPoint?.point === message.executionPoint;
    const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredPoint, message);
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
          "primary-highlight": isPrimaryHighlighted,
          "secondary-highlight": isSecondaryHighlighted,
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        <Marker message={message} onClick={onClick} />
      </a>
    );
  }
}

export default connect(null, {
  setHoveredPoint: actions.setHoveredPoint,
  seek: actions.seek,
})(Message);

import React from "react";

import { LocalizationHelper } from "devtools/shared/l10n";
import { getPixelOffset, getPixelDistance, getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";
import { timelineMarkerWidth } from "../../constants";
import { selectors } from "ui/reducers";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");
const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

function sameLocation(highlightedLocation, messageFrame) {
  return (
    highlightedLocation &&
    messageFrame &&
    highlightedLocation.sourceId === messageFrame.sourceId &&
    highlightedLocation.line === messageFrame.line &&
    highlightedLocation.column === messageFrame.column
  );
}

function isHoveredInGutter(hoveredLocation, messageLocation) {
  if (!hoveredLocation || !messageLocation) {
    return false;
  }

  return getLocationKey(hoveredLocation) === getLocationKey(messageLocation);
}

// Don't change this haphazardly. This marker is intentionally 11px x 11px, so that it
// can be center aligned perfectly with a 1px timeline scrubber line. This means that
// it can also center aligned with other elements so long as those other elements have
// an odd px measurement on the relevant dimension (height/width).

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
export function Marker({ message, onMarkerClick, onMarkerMouseEnter, onMarkerMouseLeave }) {
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
        onClick={e => onMarkerClick(e, message)}
        onMouseEnter={onMarkerMouseEnter}
        onMouseLeave={onMarkerMouseLeave}
      />
      {/* <circle cx="5.5" cy="5.5" r="4.5" stroke="black" strokeWidth="2" /> */}
      <circle className="stroke" cx="5.5" cy="5.5" r="5" stroke="black" strokeWidth="0" />
    </svg>
  );
}

class Message extends React.Component {
  render() {
    const {
      message,
      currentTime,
      highlightedMessageId,
      highlightedLocation,
      zoomRegion,
      overlayWidth,
      onMarkerClick,
      onMarkerMouseEnter,
      onMarkerMouseLeave,
      hoveredLineNumberLocation,
    } = this.props;

    const offset = getPixelOffset({
      time: message.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (offset < 0) {
      return null;
    }

    // Check to see if a message appears after the current execution point
    const isFuture =
      getPixelDistance({
        to: message.executionPointTime,
        from: currentTime,
        overlayWidth,
        zoom: zoomRegion,
      }) >
      timelineMarkerWidth / 2;

    // A marker is highlighted if either the message or its location is highlighted
    const isHighlighted =
      highlightedMessageId == message.id ||
      sameLocation(highlightedLocation, message.frame) ||
      isHoveredInGutter(hoveredLineNumberLocation, message.frame);

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
          future: isFuture,
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
      >
        <Marker
          message={message}
          onMarkerClick={onMarkerClick}
          onMarkerMouseEnter={onMarkerMouseEnter}
          onMarkerMouseLeave={onMarkerMouseLeave}
        />
      </a>
    );
  }
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
export default connect(state => ({
  highlightedLocation: selectors.getHighlightedLocation(state),
  hoveredLineNumberLocation: selectors.getHoveredLineNumberLocation(state),
}))(Message);

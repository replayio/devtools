import ReactDOM from "react-dom";
import React from "react";

import { LocalizationHelper } from "devtools/shared/l10n";
import { getPixelOffset, getPixelDistance, getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";
import { timelineMarkerWidth } from "../../constants";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");
const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

function sameLocation(m1, m2) {
  const f1 = m1.frame;
  const f2 = m2.frame;

  return f1.source === f2.source && f1.line === f2.line && f1.column === f2.column;
}

// Don't change this haphazardly. This marker is intentionally 11px x 11px, so that it
// can be center aligned perfectly with a 1px timeline scrubber line. This means that
// it can also center aligned with other elements so long as those other elements have
// an odd px measurement on the relevant dimension (height/width).

// If you do modify this, make sure you change EVERY single reference to this 11px width in
// the codebase. This includes, but is not limited to, the Timeline component, Message component,
// the timeline utilities, and the timeline styling.
function Marker({ message, onMarkerClick, onMarkerMouseEnter, onMarkerMouseLeave }) {
  // The stroke path element here has `pointer-events: none` enabled, so that it defers the event
  // handling to the fill path element. Without that property, we'd have to set the event handlers
  // on the stroke path element as well.
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path
        className="fill"
        d="M11 5.5L5.5 0 0 5.5 5.5 11 11 5.5Z"
        fill="black"
        onClick={e => onMarkerClick(e, message)}
        onMouseEnter={onMarkerMouseEnter}
        onMouseLeave={onMarkerMouseLeave}
      />
      {/* <path
        className="inner-stroke"
        d="M1.4 5.5L5.5 1.4 9.6 5.5 5.5 9.6 1.4 5.5Z"
        style="stroke-width:2;stroke:black"
      /> */}
      <path className="stroke" d="M0.7 5.5L5.5 0.7 10.3 5.5 5.5 10.3 0.7 5.5Z" stroke="black" />
    </svg>
  );
}

class Message extends React.Component {
  render() {
    const {
      message,
      messages,
      currentTime,
      highlightedMessage,
      zoomRegion,
      overlayWidth,
      visibleIndex,
      index,
      onMarkerClick,
      onMarkerMouseEnter,
      onMarkerMouseLeave,
    } = this.props;

    const offset = getPixelOffset({
      time: message.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    const previousVisibleMessage = messages[visibleIndex];

    if (offset < 0) {
      return null;
    }

    // Check to see if two messages overlay each other on the timeline
    const distance = getPixelDistance({
      to: message.executionPointTime,
      from: previousVisibleMessage?.executionPointTime,
      overlayWidth,
      zoom: zoomRegion,
    });

    if (distance < 2.5) {
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

    const isHighlighted = highlightedMessage == message.id;

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
export default connect(state => ({}), {})(Message);

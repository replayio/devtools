import ReactDOM from "react-dom";
import React from "react";

import { LocalizationHelper } from "devtools/shared/l10n";
import { getPixelOffset, getPixelDistance, getLeftOffset } from "../../utils/timeline";
import { connect } from "react-redux";
import classnames from "classnames";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");
const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

const markerWidth = 7;

function sameLocation(m1, m2) {
  const f1 = m1.frame;
  const f2 = m2.frame;

  return f1.source === f2.source && f1.line === f2.line && f1.column === f2.column;
}

class Message extends React.Component {
  render() {
    const {
      message,
      messages,
      currentTime,
      pausedMessage,
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

    if (distance < 1) {
      return null;
    }

    const isOverlayed = distance < markerWidth;

    // Check to see if a message appears after the current execution point
    const isFuture =
      getPixelDistance({
        to: message.executionPointTime,
        from: currentTime,
        overlayWidth,
        zoom: zoomRegion,
      }) >
      markerWidth / 2;

    const isHighlighted = highlightedMessage == message.id;

    const atPausedLocation = pausedMessage && sameLocation(pausedMessage, message);

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
        className={classnames("message", {
          overlayed: isOverlayed,
          future: isFuture,
          highlighted: isHighlighted,
          location: atPausedLocation,
        })}
        style={{
          left: `${getLeftOffset({ message, overlayWidth, zoom: zoomRegion })}%`,
          zIndex: `${index + 100}`,
        }}
        title={getFormatStr("jumpMessage2", frameLocation)}
        onClick={e => onMarkerClick(e, message)}
        onMouseEnter={onMarkerMouseEnter}
        onMouseLeave={onMarkerMouseLeave}
      />
    );
  }
}
export default connect(state => ({}), {})(Message);

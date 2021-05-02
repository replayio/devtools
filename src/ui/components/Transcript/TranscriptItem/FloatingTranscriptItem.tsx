import React from "react";
import { connect, ConnectedProps } from "react-redux";

import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
import TranscriptItem from "./TranscriptItem";
import { FloatingItem } from "ui/state/comments";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";

const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { getFormattedTime } = require("ui/utils/timeline");
const { findClosestFunction } = require("devtools/client/debugger/src/utils/ast");
const { getSymbols } = require("devtools/client/debugger/src/reducers/ast");

type PropsFromParent = {
  item: FloatingItem;
};

type PauseTranscriptItemProps = PropsFromRedux & PropsFromParent;

// Transcript item component for displaying a temporary pause point that is not already
// accounted for by one of the displayed entries.

function PauseTranscriptItem({
  item,
  pendingComment,
  snippet,
  closestFunction,
}: PauseTranscriptItemProps) {
  let icon = "location-marker";
  let label = "Point In Time";
  let type = "time";
  let secondaryLabel = getFormattedTime(item.time);
  let highlightSecondaryLabel = false;

  if (item.location) {
    const { sourceUrl, line } = item.location;
    const filename = getFilenameFromURL(sourceUrl);

    icon = "document-text";
    label = closestFunction?.name || `${filename}:${line}`;
    type = "code";
    secondaryLabel = snippet;
    highlightSecondaryLabel = true;
  }

  return (
    <TranscriptItem
      item={item}
      icon={<div className={`img ${icon}`} />}
      label={label}
      type={type}
      secondaryLabel={secondaryLabel}
      highlightSecondaryLabel={highlightSecondaryLabel}
    >
      {pendingComment ? <CommentThread comment={null} time={item.time} /> : null}
    </TranscriptItem>
  );
}

const connector = connect(
  (state: UIState, { item: { location } }: PropsFromParent) => ({
    snippet: location ? getTextAtLocation(state, location.sourceId, location) : null,
    pendingComment: selectors.getPendingComment(state),
    closestFunction: location
      ? findClosestFunction(getSymbols(state, { id: location?.sourceId }), location)
      : null,
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PauseTranscriptItem);

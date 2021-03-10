import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
import TranscriptItem from "./TranscriptItem";
import { PendingComment, PauseItem, SourceLocation } from "ui/state/comments";
import { ThreadFront } from "protocol/thread";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { getFormattedTime } = require("ui/utils/timeline");

type PauseTranscriptItemProps = PropsFromRedux & {
  item: PauseItem;
  pendingComment: PendingComment | null;
};

// Transcript item component for displaying a temporary pause point that is not already
// accounted for by one of the displayed entries.

function PauseTranscriptItem({ item, pendingComment, state }: PauseTranscriptItemProps) {
  const [sourceLocation, setSourceLocation] = useState<SourceLocation | null>(null);
  let icon = "location-marker";
  let label = "Point In Time";
  let secondaryLabel = getFormattedTime(item.time);

  // This should be set when we create a comment pending or otherwise
  // useEffect(() => {
  //   const getSourceLocation = async () => {
  //     const location = (await ThreadFront.getCurrentPauseSourceLocation()) || null;
  //     setSourceLocation(location);
  //   };
  //   getSourceLocation();
  // }, [item]);

  if (sourceLocation) {
    const filename = getFilenameFromURL(sourceLocation.sourceUrl);
    icon = "document-text";
    label = `${filename}:${sourceLocation.line}`;
    secondaryLabel = props.snippet;
  }

  return (
    <TranscriptItem
      item={item}
      icon={<div className={`img ${icon}`} />}
      label={label}
      secondaryLabel={secondaryLabel}
    >
      {pendingComment ? <CommentThread comment={null} time={item.time} /> : null}
    </TranscriptItem>
  );
}

const connector = connect(
  (state: UIState, props) => ({
    snippet: selectors.getTextAtLocation(
      state,
      props.sourceLocation.sourceId,
      props.sourceLocation
    ),
    closestFunction: selectors.getClosestFunction(state, props.sourceLocation),
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PauseTranscriptItem);

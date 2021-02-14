import React, { useEffect, useRef } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { Comment, PendingComment } from "ui/state/comments";
import { MouseEvent } from "@recordreplay/protocol";
import { UIState } from "ui/state";
import "./TranscriptItem.css";

type TranscriptItemProps = PropsFromRedux & {
  item: Comment | MouseEvent | PendingComment;
  label: string;
  secondaryLabel: string;
  icon: JSX.Element;
  children?: JSX.Element | null;
};

function TranscriptItem({
  item,
  icon,
  label,
  children,
  currentTime,
  hoveredPoint,
  activeComment,
  pendingComment,
  seek,
  setHoveredPoint,
  setActiveComment,
  clearPendingComment,
}: TranscriptItemProps) {
  const itemNode = useRef<HTMLDivElement>(null);

  useEffect(
    function ScrollToHoveredItem() {
      if (
        itemNode.current &&
        hoveredPoint?.point == item.point &&
        hoveredPoint?.target !== "transcript"
      ) {
        itemNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [hoveredPoint]
  );

  const onClick = () => {
    const { point, time } = item;

    // Don't seek anywhere when clicking on a pending comment.
    if (pendingComment == item) {
      return;
    }

    if ("has_frames" in item) {
      seek(point, time, item.has_frames);
    } else {
      seek(point, time, false);
    }

    clearPendingComment();
    setActiveComment(item);
  };
  const onMouseLeave = () => {
    setHoveredPoint(null);
  };
  const onMouseEnter = () => {
    const { point, time } = item;
    const hoveredPoint = {
      point,
      time,
      target: "transcript" as "transcript",
    };

    setHoveredPoint(hoveredPoint);
  };

  const { point, time } = item;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={classnames("transcript-entry", {
        selected: activeComment === item && activeComment.content == "",
        "primary-highlight": hoveredPoint?.point === point && hoveredPoint?.time === time,
        paused: currentTime == time,
        "before-paused": time < currentTime,
      })}
      ref={itemNode}
    >
      <span className="transcript-line" />
      <div className="transcript-entry-description">
        <div className="transcript-entry-icon">{icon}</div>
        <div className="transcript-entry-label">{label}</div>
        {pendingComment == item && (
          <button className="new-comment-cancel" onClick={clearPendingComment}>
            Cancel
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    hoveredPoint: selectors.getHoveredPoint(state),
    activeComment: selectors.getActiveComment(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setHoveredPoint: actions.setHoveredPoint,
    seek: actions.seek,
    setActiveComment: actions.setActiveComment,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TranscriptItem);

import React, { useEffect, useRef } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { Comment, PendingComment } from "ui/state/comments";
import { UIState } from "ui/state";
import { Event } from "ui/state/comments";
import "./TranscriptItem.css";
import { HoveredItem } from "ui/state/timeline";
import ReplyButton from "./ReplyButton";

type TranscriptItemProps = PropsFromRedux & {
  item: Comment | Event | PendingComment;
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
  hoveredItem,
  activeComment,
  pendingComment,
  seek,
  setHoveredItem,
  setActiveComment,
  clearPendingComment,
}: TranscriptItemProps) {
  const itemNode = useRef<HTMLDivElement>(null);

  useEffect(
    function ScrollToHoveredItem() {
      if (
        itemNode.current &&
        hoveredItem?.point == item.point &&
        hoveredItem?.target !== "transcript"
      ) {
        itemNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [hoveredItem]
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
    setHoveredItem(null);
  };
  const onMouseEnter = () => {
    const { point, time } = item;
    const hoveredItem: HoveredItem = {
      point,
      time,
      target: "transcript",
    };

    setHoveredItem(hoveredItem);
  };

  const { point, time } = item;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={classnames("transcript-entry", {
        selected: activeComment === item && activeComment.content == "",
        "primary-highlight": hoveredItem?.point === point && hoveredItem?.time === time,
        paused: currentTime == time,
        "before-paused": time < currentTime,
      })}
      ref={itemNode}
    >
      <div className="transcript-entry-description">
        <div className="transcript-entry-icon">{icon}</div>
        <div className="transcript-entry-label">{label}</div>
        <ReplyButton item={item} />
      </div>
      {children}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    hoveredItem: selectors.getHoveredItem(state),
    activeComment: selectors.getActiveComment(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setHoveredItem: actions.setHoveredItem,
    seek: actions.seek,
    setActiveComment: actions.setActiveComment,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TranscriptItem);

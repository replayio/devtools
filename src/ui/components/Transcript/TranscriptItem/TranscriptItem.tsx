import React, { useEffect, useRef } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { Comment, PauseItem } from "ui/state/comments";
import { UIState } from "ui/state";
import { Event } from "ui/state/comments";
import "./TranscriptItem.css";
import { HoveredItem } from "ui/state/timeline";
import ReplyButton from "ui/components/Transcript/ReplyButton";

type TranscriptItemProps = PropsFromRedux & {
  item: Comment | Event | PauseItem;
  label: string;
  secondaryLabel: string;
  icon: JSX.Element;
  children?: JSX.Element | null;
};

function TranscriptItem({
  currentTime,
  hoveredItem,
  item,
  icon,
  label,
  secondaryLabel,
  clearPendingComment,
  seek,
  setHoveredItem,
  children,
}: TranscriptItemProps) {
  const itemNode = useRef<HTMLDivElement>(null);
  const { point, time } = item;

  useEffect(
    function ScrollToHoveredItem() {
      if (itemNode.current && hoveredItem?.point == point && hoveredItem?.target !== "transcript") {
        itemNode.current.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [hoveredItem]
  );

  const onClick = () => {
    if ("has_frames" in item) {
      seek(point, time, item.has_frames);
    } else {
      seek(point, time, false);
    }

    clearPendingComment();
  };
  const onMouseLeave = () => {
    setHoveredItem(null);
  };
  const onMouseEnter = () => {
    const hoveredItem: HoveredItem = {
      point,
      time,
      target: "transcript",
    };

    setHoveredItem(hoveredItem);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={classnames("transcript-entry", {
        "primary-highlight": hoveredItem?.point === point && hoveredItem?.time === time,
        paused: currentTime == time,
      })}
      ref={itemNode}
    >
      <div className="transcript-entry-description">
        <div className="transcript-entry-icon">{icon}</div>
        <div className="transcript-entry-label">
          <div className="label">{label}</div>
          <div className="secondary-label">{secondaryLabel}</div>
        </div>
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
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setHoveredItem: actions.setHoveredItem,
    seek: actions.seek,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TranscriptItem);

import classnames from "classnames";
import React, { ReactNode, memo } from "react";

import { RecordedEvent } from "protocol/RecordedEventsCache";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { jumpToKnownEventListenerHit } from "ui/actions/eventListeners/jumpToCode";
import useEventContextMenu from "ui/components/Events/useEventContextMenu";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { setMarkTimeStampPoint } from "ui/reducers/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { ParsedJumpToCodeAnnotation } from "ui/suspense/annotationsCaches";

import MaterialIcon from "../shared/MaterialIcon";
import { getReplayEvent } from "./eventKinds";
import styles from "./Event.module.css";

type EventProps = {
  currentTime: number;
  event: RecordedEvent;
  executionPoint: string;
  jumpToCodeAnnotation?: ParsedJumpToCodeAnnotation;
  jumpToCodeLoadingStatus: "loading" | "complete";
  onSeek: (point: string, time: number) => void;
};

export const getEventLabel = (event: RecordedEvent) => {
  const { kind } = event;
  const { label } = getReplayEvent(kind);

  if (kind === "navigation") {
    const url = new URL(event.url);
    return <span title={event.url}>{url.host}</span>;
  }

  if ("key" in event) {
    return `${label} ${event.key}`;
  }

  return label;
};

export default memo(function Event({
  currentTime,
  executionPoint,
  event,
  onSeek,
  jumpToCodeAnnotation,
  jumpToCodeLoadingStatus,
}: EventProps) {
  const dispatch = useAppDispatch();
  const { kind, point, time } = event;
  const isPaused = time === currentTime && executionPoint === point;
  const label = getEventLabel(event);
  const { icon } = getReplayEvent(kind);
  const [, dismissJumpToCodeNag] = useNag(Nag.JUMP_TO_CODE);
  const [, dismissJumpToEventNag] = useNag(Nag.JUMP_TO_EVENT);

  const onKeyDown = (e: React.KeyboardEvent) => e.key === " " && e.preventDefault();

  const onClickSeek = () => {
    onSeek(point, time);
    dismissJumpToEventNag(); // Replay Passport
  };

  const onClickJumpToCode = async () => {
    // Seek to the sidebar event timestamp right away.
    // That way we're at least _close_ to the right time
    dispatch(jumpToKnownEventListenerHit(onSeek, jumpToCodeAnnotation!));

    // update Replay Passport
    dismissJumpToCodeNag();
  };

  const { contextMenu, onContextMenu } = useEventContextMenu(event);

  const onMouseEnter = () => {
    dispatch(
      setMarkTimeStampPoint({
        point: event.point,
        time: event.time,
      })
    );
  };

  const onMouseLeave = () => {
    dispatch(setMarkTimeStampPoint(null));
  };

  let renderedJumpToCodeButton: React.ReactNode = null;

  if (event.kind === "mousedown" || event.kind === "keypress") {
    // The backend routine only saves annotations for actual hits.
    // If there's no annotation, we know there's no hits.
    const annotationsLoading = jumpToCodeLoadingStatus === "loading";
    const hasJumpToCodeAnnotation = !!jumpToCodeAnnotation;
    const jumpToCodeStatus: JumpToCodeStatus = annotationsLoading
      ? "loading"
      : hasJumpToCodeAnnotation
      ? "found"
      : "no_hits";

    renderedJumpToCodeButton = (
      <JumpToCodeButton
        onClick={onClickJumpToCode}
        status={jumpToCodeStatus}
        currentExecutionPoint={executionPoint}
        targetExecutionPoint={event.point}
      />
    );
  }

  return (
    <>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-test-name="Event"
        data-test-type={event.kind}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon iconSize="xl">{icon}</MaterialIcon>
          <Label dataTestName="EventLabel">{label}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {renderedJumpToCodeButton}
        </div>
      </div>
      {contextMenu}
    </>
  );
});

const Label = ({ children, dataTestName }: { children: ReactNode; dataTestName?: string }) => (
  <div
    className="overflow-hidden overflow-ellipsis whitespace-pre font-normal"
    data-test-name={dataTestName}
  >
    {children}
  </div>
);

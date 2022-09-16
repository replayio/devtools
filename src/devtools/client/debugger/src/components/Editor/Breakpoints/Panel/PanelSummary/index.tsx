import classNames from "classnames";
import { AddCommentButton } from "design";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import React, { Dispatch, SetStateAction } from "react";
import "reactjs-popup/dist/index.css";
import { useAppDispatch } from "ui/setup/hooks";
import { createFloatingCodeComment, createFrameComment } from "ui/actions/comments";
import { enterFocusMode } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

import Condition from "./Condition";
import Log from "./Log";
import Popup from "./Popup";
import useAuth0 from "ui/utils/useAuth0";
import { TimeStampedPoint } from "@replayio/protocol";

export type Input = "condition" | "logValue";

type PanelSummaryProps = {
  breakpoint: any;
  executionPoint: any;
  hitPoints: TimeStampedPoint[] | null;
  isHot: boolean;
  pausedOnHit: boolean;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
  toggleEditingOn: () => void;
};

export default function PanelSummary({
  breakpoint,
  hitPoints,
  isHot,
  pausedOnHit,
  setInputToFocus,
  toggleEditingOn,
}: PanelSummaryProps) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();
  const recordingId = useGetRecordingId();
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth0();

  const isLoaded = !isHot;
  const isEditable = isLoaded && isTeamDeveloper;

  const focusInput = (input: Input) => {
    if (isEditable) {
      trackEvent("breakpoint.start_edit", {
        input,
        hitsCount: hitPoints?.length || null,
      });
      toggleEditingOn();
      setInputToFocus(input);
    }
  };

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Un-authenticated users can't comment on Replays.
    if (!isAuthenticated) {
      return null;
    }

    trackEvent("breakpoint.add_comment");

    if (pausedOnHit) {
      dispatch(createFrameComment(null, recordingId, breakpoint));
    } else {
      dispatch(createFloatingCodeComment(recordingId, breakpoint));
    }
  };

  if (isHot) {
    trackEvent("breakpoint.too_many_points");
    return (
      <div className="flex items-center rounded-t summary bg-errorBgcolor text-errorColor">
        <Popup
          trigger={
            <div className="flex items-center pl-2 space-x-2 overflow-hidden">
              <MaterialIcon className="text-xl">error</MaterialIcon>
              <span
                className="overflow-hidden whitespace-pre cursor-pointer overflow-ellipsis"
                onClick={() => dispatch(enterFocusMode())}
              >
                Use Focus Mode to reduce the number of hits.
              </span>
            </div>
          }
        >
          This log cannot be edited because <br />
          it was hit {MAX_POINTS_FOR_FULL_ANALYSIS}+ times
        </Popup>

        {isAuthenticated && <AddCommentButton onClick={addComment} isPausedOnHit={pausedOnHit} />}
      </div>
    );
  }

  return (
    <div
      className={classNames("summary flex items-center gap-2 text-gray-500", { enabled: isLoaded })}
    >
      <div className="flex flex-col flex-grow statements-container">
        {conditionValue && (
          <Condition
            isEditable={isEditable}
            onClick={() => focusInput("condition")}
            value={conditionValue}
          />
        )}
        <Log
          hasCondition={!!conditionValue}
          isEditable={isEditable}
          onClick={() => focusInput("logValue")}
          value={logValue}
        />
        {!isTeamDeveloper ? (
          <Popup
            trigger={<span className="text-gray-400 cursor-default material-icons">lock</span>}
          >
            Editing logpoints is available for Developers in the Team plan
          </Popup>
        ) : null}
      </div>
      {isAuthenticated && <AddCommentButton onClick={addComment} isPausedOnHit={pausedOnHit} />}
    </div>
  );
}

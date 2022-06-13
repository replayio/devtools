import classNames from "classnames";
import { AddCommentButton } from "components";
import { LocationAnalysisSummary } from "devtools/client/debugger/src/reducers/breakpoints";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import React, { Dispatch, SetStateAction } from "react";
import "reactjs-popup/dist/index.css";
import { useDispatch } from "react-redux";
import { createFloatingCodeComment, createFrameComment } from "ui/actions/comments";
import { enterFocusMode } from "ui/actions/timeline";
import PrefixBadgeButton from "ui/components/PrefixBadge";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

import Condition from "./Condition";
import Log from "./Log";
import Popup from "./Popup";

export type Input = "condition" | "logValue";

type PanelSummaryProps = {
  analysisPoints?: LocationAnalysisSummary;
  breakpoint: any;
  executionPoint: any;
  isHot: boolean;
  pausedOnHit: boolean;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
  toggleEditingOn: () => void;
};

export default function PanelSummary({
  analysisPoints,
  breakpoint,
  isHot,
  pausedOnHit,
  setInputToFocus,
  toggleEditingOn,
}: PanelSummaryProps) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();
  const recordingId = useGetRecordingId();
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const dispatch = useDispatch();

  const isLoaded = Boolean(analysisPoints && !isHot);
  const isEditable = isLoaded && isTeamDeveloper;

  const focusInput = (input: Input) => {
    if (isEditable) {
      trackEvent("breakpoint.start_edit", {
        input,
        hitsCount: analysisPoints?.data?.length || null,
      });
      toggleEditingOn();
      setInputToFocus(input);
    }
  };

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();

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
      <div className="summary flex items-center rounded-t bg-errorBgcolor text-errorColor">
        <Popup
          trigger={
            <div className="flex items-center space-x-2 overflow-hidden pl-2">
              <MaterialIcon className="text-xl">error</MaterialIcon>
              <span
                className="cursor-pointer overflow-hidden overflow-ellipsis whitespace-pre"
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
        <div className="button-container flex items-center">
          <AddCommentButton onClick={addComment} isPausedOnHit={pausedOnHit} />
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("summary flex items-center text-gray-500", { enabled: isLoaded })}>
      <PrefixBadgeButton breakpoint={breakpoint} />
      <div className="statements-container flex flex-grow flex-col">
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
            trigger={<span className="material-icons cursor-default text-gray-400">lock</span>}
          >
            Editing logpoints is available for Developers in the Team plan
          </Popup>
        ) : null}
      </div>
      <div className="button-container flex items-center">
        <AddCommentButton onClick={addComment} isPausedOnHit={pausedOnHit} />
      </div>
    </div>
  );
}

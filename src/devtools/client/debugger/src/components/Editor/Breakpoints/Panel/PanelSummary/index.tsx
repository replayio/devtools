import React, { Dispatch, SetStateAction, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import CommentButton from "./CommentButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Popup from "./Popup";
import hooks from "ui/hooks";
import { UIState } from "ui/state";

const { prefs } = require("ui/utils/prefs");

import "reactjs-popup/dist/index.css";
import Log from "./Log";
import Condition from "./Condition";
import useAuth0 from "ui/utils/useAuth0";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import classNames from "classnames";
import { trackEvent } from "ui/utils/telemetry";
import { HitsContext, Input, PanelErrors } from "../Panel";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import { getCurrentTime } from "ui/reducers/timeline";
import { getAnalysisPointsForBreakpoint } from "ui/reducers/app";
import { createFloatingCodeComment, createFrameComment } from "ui/actions/comments";
import { AnalysisPayload } from "ui/state/app";

type PanelSummaryProps = {
  breakpoint: any;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
  toggleEditingOn: () => void;
};

const useGetIsPausedOnHit = (analysisPoints?: AnalysisPayload) => {
  const currentTime = useSelector(getCurrentTime);
  const executionPoint = useSelector(getExecutionPoint);
  const pausedOnHit =
    !!analysisPoints &&
    !analysisPoints.error &&
    !!analysisPoints?.data.find(
      ({ point, time }) => point == executionPoint && time == currentTime
    );

  return pausedOnHit;
};

export default function PanelSummary({
  breakpoint,
  setInputToFocus,
  toggleEditingOn,
}: PanelSummaryProps) {
  const dispatch = useDispatch();
  const analysisPoints = useSelector((state: UIState) =>
    getAnalysisPointsForBreakpoint(state, breakpoint)
  )!;
  const executionPoint = useSelector(getExecutionPoint)!;
  const currentTime = useSelector(getCurrentTime);
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const recordingId = useGetRecordingId();
  const isPausedOnHit = useGetIsPausedOnHit(analysisPoints);
  const { error } = useContext(HitsContext);

  const isHot = error === PanelErrors.TooManyPoints || error === PanelErrors.MaxHits;
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;
  const isEditable = isTeamDeveloper && !isHot;

  const focusInput = (input: Input) => {
    if (isEditable) {
      trackEvent("breakpoint.start_edit", {
        input,
        hitsCount: analysisPoints?.data.length || null,
      });
      toggleEditingOn();
      setInputToFocus(input);
    }
  };

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    trackEvent("breakpoint.add_comment");

    if (isPausedOnHit) {
      dispatch(
        createFrameComment(
          currentTime,
          executionPoint,
          null,
          { ...user, userId },
          recordingId,
          breakpoint
        )
      );
    } else {
      dispatch(
        createFloatingCodeComment(
          currentTime,
          executionPoint,
          { ...user, id: userId },
          recordingId,
          breakpoint
        )
      );
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
              <span className="overflow-hidden overflow-ellipsis whitespace-pre">
                Use {""}
                <a
                  href="https://www.notion.so/replayio/Viewer-26591deb256c473a946d0f64abb67859#bf19baaa57004b0d9282cc0a02b281f5"
                  rel="noreferrer noopener"
                  className="underline "
                  target="_blank"
                >{`Focus Mode`}</a>{" "}
                to reduce the number of hits.
              </span>
            </div>
          }
        >
          This log cannot be edited because <br />
          it was hit {prefs.maxHitsDisplayed}+ times
        </Popup>
        <div className="button-container flex items-center">
          <CommentButton addComment={addComment} pausedOnHit={isPausedOnHit} />
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("summary flex items-center text-gray-500", { enabled: isEditable })}>
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
        <CommentButton addComment={addComment} pausedOnHit={isPausedOnHit} />
      </div>
    </div>
  );
}

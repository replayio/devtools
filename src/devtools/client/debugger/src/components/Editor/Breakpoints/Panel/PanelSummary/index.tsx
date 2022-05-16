import classNames from "classnames";
import { AddCommentButton } from "components";
import React, { Dispatch, SetStateAction, useRef, useEffect } from "react";
import "reactjs-popup/dist/index.css";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { AnalysisPayload } from "ui/state/app";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import Condition from "./Condition";
import Log from "./Log";
import Popup from "./Popup";

const { prefs } = require("ui/utils/prefs");

export type Input = "condition" | "logValue";

type PanelSummaryProps = PropsFromRedux & {
  analysisPoints?: AnalysisPayload;
  breakpoint: any;
  executionPoint: any;
  isHot: boolean;
  pausedOnHit: boolean;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
  toggleEditingOn: () => void;
};

function PanelSummary({
  analysisPoints,
  breakpoint,
  createFloatingCodeComment,
  createFrameComment,
  currentTime,
  enterFocusMode,
  executionPoint,
  isHot,
  pausedOnHit,
  setInputToFocus,
  toggleEditingOn,
}: PanelSummaryProps) {
  const { isTeamDeveloper } = hooks.useIsTeamDeveloper();
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const recordingId = useGetRecordingId();
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const isLoaded = Boolean(analysisPoints && !isHot);
  const isEditable = isLoaded && isTeamDeveloper;

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

    if (pausedOnHit) {
      createFrameComment(
        currentTime,
        executionPoint,
        null,
        { ...user, userId },
        recordingId,
        breakpoint
      );
    } else {
      createFloatingCodeComment(
        currentTime,
        executionPoint,
        { ...user, id: userId },
        recordingId,
        breakpoint
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
              <span
                className="cursor-pointer overflow-hidden overflow-ellipsis whitespace-pre"
                onClick={() => {
                  enterFocusMode();
                }}
              >
                Use Focus Mode to reduce the number of hits.
              </span>
            </div>
          }
        >
          This log cannot be edited because <br />
          it was hit {prefs.maxHitsDisplayed}+ times
        </Popup>
        <div className="button-container flex items-center">
          <AddCommentButton onClick={addComment} isPausedOnHit={pausedOnHit} />
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("summary flex items-center text-gray-500", { enabled: isLoaded })}>
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

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
  }),
  {
    createFrameComment: actions.createFrameComment,
    createFloatingCodeComment: actions.createFloatingCodeComment,
    enterFocusMode: actions.enterFocusMode,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PanelSummary);

import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";

import CommentButton from "./CommentButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Popup from "./Popup";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";

const { prefs } = require("ui/utils/prefs");

import "reactjs-popup/dist/index.css";
import Log from "./Log";
import Condition from "./Condition";
import useAuth0 from "ui/utils/useAuth0";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserId } from "ui/hooks/users";
import classNames from "classnames";
import { trackEvent } from "ui/utils/telemetry";
import { AnalysisPayload } from "ui/state/app";

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
          <CommentButton addComment={addComment} pausedOnHit={pausedOnHit} />
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
        <CommentButton addComment={addComment} pausedOnHit={pausedOnHit} />
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
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PanelSummary);

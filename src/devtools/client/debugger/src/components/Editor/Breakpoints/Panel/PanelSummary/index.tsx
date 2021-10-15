import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";

import CommentButton from "./CommentButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Popup from "./Popup";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import { actions } from "ui/actions";
import { getRecordingId } from "ui/utils/environment";
import { selectors } from "ui/reducers";

const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
const { prefs } = require("ui/utils/prefs");

import "reactjs-popup/dist/index.css";
import "ui/components/reactjs-popup.css";
import Log from "./Log";
import Condition from "./Condition";

export type Input = "condition" | "logValue";

type PanelSummaryProps = PropsFromRedux & {
  breakpoint: any;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
  toggleEditingOn: () => void;
};

function PanelSummary({
  breakpoint,
  toggleEditingOn,
  setInputToFocus,
  createFrameComment,
  createFloatingCodeComment,
  executionPoint,
  currentTime,
  analysisPoints,
}: PanelSummaryProps) {
  const recordingId = getRecordingId();
  const { recording } = hooks.useGetRecording(recordingId);
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const isHot = analysisPoints && analysisPoints.length > prefs.maxHitsDisplayed;
  const didExceedMaxHitsEditable = !!(
    analysisPoints && analysisPoints.length < prefs.maxHitsEditable
  );
  const isTeamDeveloper = recording ? recording.userRole !== "team-user" : false;
  const isEditable = didExceedMaxHitsEditable && isTeamDeveloper;

  const handleClick = (event: React.MouseEvent, input: Input) => {
    if (!isEditable) {
      return;
    }

    event.stopPropagation();
    toggleEditingOn();
    setInputToFocus(input);
  };

  const pausedOnHit =
    analysisPoints !== "error" &&
    !!analysisPoints?.find(point => point.point == executionPoint && point.time == currentTime);

  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (pausedOnHit) {
      console.log("createFrameComment", currentTime, executionPoint, breakpoint);
      createFrameComment(currentTime, executionPoint, null, breakpoint);
    } else {
      console.log("createFloatingCodeComment", currentTime, executionPoint, breakpoint);
      createFloatingCodeComment(currentTime, executionPoint, breakpoint);
    }
  };

  if (!analysisPoints || analysisPoints === "error") {
    return (
      <div className="summary">
        <div className="options items-center flex-col flex-grow">
          <Log
            value={logValue}
            hasCondition={!!conditionValue}
            {...{ isTeamDeveloper, didExceedMaxHitsEditable }}
          />
        </div>
        <CommentButton addComment={addComment} pausedOnHit={pausedOnHit} />
      </div>
    );
  }

  if (isHot) {
    return (
      <div className="summary">
        <Popup
          trigger={
            <div className="flex items-center overflow-hidden space-x-2">
              <MaterialIcon className="text-xl leading-none">warning</MaterialIcon>
              <span className="warning-content overflow-hidden overflow-ellipsis whitespace-pre">{`This breakpoint was hit ${analysisPoints.length} times`}</span>
            </div>
          }
        >
          This log is hidden from the console <br />
          because it was hit {prefs.maxHitsDisplayed}+ times
        </Popup>
        <CommentButton addComment={addComment} pausedOnHit={pausedOnHit} />
      </div>
    );
  }

  return (
    <div className="summary space-x-2" onClick={e => handleClick(e, "logValue")}>
      <div className="options items-center flex-col flex-grow">
        {conditionValue ? (
          <Condition
            {...{
              handleClick,
              isTeamDeveloper,
              didExceedMaxHitsEditable,
            }}
            value={conditionValue}
          />
        ) : null}
        <Log
          {...{
            handleClick,
            isTeamDeveloper,
            didExceedMaxHitsEditable,
          }}
          hasCondition={true}
          value={logValue}
        />
      </div>
      {!isTeamDeveloper ? (
        <Popup trigger={<span className="material-icons cursor-default text-gray-400">lock</span>}>
          Editing logpoints is available for Developers in the Team plan
        </Popup>
      ) : null}
      <CommentButton addComment={addComment} pausedOnHit={pausedOnHit} />
    </div>
  );
}

const connector = connect(
  (state: UIState, { breakpoint }: { breakpoint: any }) => ({
    executionPoint: getExecutionPoint(state),
    currentTime: selectors.getCurrentTime(state),
    analysisPoints: selectors.getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
  }),
  {
    createFrameComment: actions.createFrameComment,
    createFloatingCodeComment: actions.createFloatingCodeComment,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PanelSummary);

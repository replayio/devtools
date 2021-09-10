import classNames from "classnames";
import React, { Dispatch, SetStateAction } from "react";
import ReactTooltip from "react-tooltip";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { getRecordingId, isDemo } from "ui/utils/environment";
import hooks from "ui/hooks";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
const { prefs } = require("ui/utils/prefs");

type Input = "condition" | "logValue";

type PanelSummaryProps = PropsFromRedux & {
  breakpoint: any;
  toggleEditingOn: () => void;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
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
  const reactTooltip = (
    <ReactTooltip delayHide={200} delayShow={200} place={"right"} multiline={true} bodyMode />
  );

  const isHot = analysisPoints && analysisPoints.length > prefs.maxHitsDisplayed;
  const didExceedMaxHitsEditable = analysisPoints && analysisPoints.length < prefs.maxHitsEditable;
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
  const addHitComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    createFrameComment(currentTime, executionPoint, null, breakpoint);
  };
  const addFloatingCodeComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    createFloatingCodeComment(currentTime, executionPoint, breakpoint);
  };

  // For loading cases where the analysisPoints haven't been received from the server yet.
  // The invisible text placeholder is there to keep the row from collapsing.
  if (!analysisPoints) {
    return (
      <div className="summary">
        <div className="invisible">Loading...</div>
      </div>
    );
  }

  if (analysisPoints === "error") {
    return (
      <div className="summary">
        <div className="invisible">Failed</div>
      </div>
    );
  }

  if (isHot) {
    return (
      <div className="summary">
        <div
          className="flex items-center overflow-hidden space-x-2"
          data-tip={`This log is hidden from the console because <br /> it was hit ${prefs.maxHitsDisplayed}+ times`}
        >
          <MaterialIcon className="text-xl">warning</MaterialIcon>
          <span className="warning-content overflow-hidden overflow-ellipsis whitespace-pre">{`This breakpoint was hit ${analysisPoints.length} times`}</span>
        </div>
        {reactTooltip}
      </div>
    );
  }

  const pausedOnHit = analysisPoints.find(
    point => point.point == executionPoint && point.time == currentTime
  );

  let tooltipContent: any = {};

  if (!didExceedMaxHitsEditable) {
    tooltipContent[
      "data-tip"
    ] = `This log is not editable because <br /> it was hit ${prefs.maxHitsEditable}+ times`;
  }

  return (
    <div className="summary space-x-2" onClick={e => handleClick(e, "logValue")}>
      <div className="options items-center" {...tooltipContent}>
        {conditionValue ? (
          <button
            className={classNames(
              "condition border rounded border-gray-400",
              isEditable
                ? "hover:bg-white hover:text-primaryAccent cursor-text"
                : "hover:bg-gray-200 cursor-auto"
            )}
            disabled={!isEditable}
            onClick={e => handleClick(e, "condition")}
          >
            if (<span className="expression">{conditionValue}</span>)
          </button>
        ) : null}
        <button
          className={classNames(
            "log border rounded",
            isEditable
              ? "border-gray-400 hover:bg-white hover:text-primaryAccent cursor-text"
              : "bg-gray-200 cursor-auto"
          )}
          disabled={!isEditable}
          onClick={e => handleClick(e, "logValue")}
        >
          <span
            className="expression"
            data-tip={
              isEditable
                ? undefined
                : "Editing logpoints is available for Developers in the Team plan"
            }
          >
            {logValue}
          </span>
        </button>
      </div>
      {!isTeamDeveloper ? (
        <span
          className="material-icons cursor-default text-gray-400"
          data-tip="Editing logpoints is available for Developers in the Team plan"
        >
          lock
        </span>
      ) : null}
      {!isDemo() ? (
        <button
          type="button"
          onClick={pausedOnHit ? addHitComment : addFloatingCodeComment}
          title="Add Comment"
          className={classNames(
            pausedOnHit ? "paused-add-comment" : "bg-primaryAccent hover:bg-primaryAccentHover",
            "inline-flex items-center px-1 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
          )}
        >
          <div className="material-icons text-base text-white add-comment-icon">add_comment</div>
        </button>
      ) : null}
      {reactTooltip}
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

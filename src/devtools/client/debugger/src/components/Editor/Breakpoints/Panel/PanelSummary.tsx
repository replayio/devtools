import classNames from "classnames";
import React, { Dispatch, SetStateAction } from "react";
import ReactTooltip from "react-tooltip";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { getRecordingId } from "ui/reducers/app";
import { UIState } from "ui/state";
import { isDemo } from "ui/utils/environment";
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
  recordingId,
  toggleEditingOn,
  setInputToFocus,
  createComment,
  executionPoint,
  currentTime,
  analysisPoints,
}: PanelSummaryProps) {
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;
  const reactTooltip = (
    <ReactTooltip delayHide={200} delayShow={200} place={"right"} multiline={true} />
  );

  const isHot = analysisPoints && analysisPoints.length > prefs.maxHitsDisplayed;
  const isEditable = analysisPoints && analysisPoints.length < prefs.maxHitsEditable;

  const handleClick = (event: React.MouseEvent, input: Input) => {
    if (!isEditable) {
      return;
    }

    event.stopPropagation();
    toggleEditingOn();
    setInputToFocus(input);
  };
  const addComment = (e: React.MouseEvent) => {
    e.stopPropagation();

    createComment(currentTime, executionPoint, null);
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

  if (!isEditable) {
    tooltipContent[
      "data-tip"
    ] = `This log is not editable because <br /> it was hit ${prefs.maxHitsEditable}+ times`;
  }

  return (
    <div className="summary" onClick={e => handleClick(e, "logValue")}>
      <div className="options" {...tooltipContent}>
        {conditionValue ? (
          <button
            className={classNames(
              "condition",
              isEditable ? "hover:bg-gray-200 hover:text-primaryAccent" : "cursor-auto"
            )}
            disabled={!isEditable}
            onClick={e => handleClick(e, "condition")}
          >
            if (<span className="expression">{conditionValue}</span>)
          </button>
        ) : null}
        <button
          className={classNames(
            "log",
            isEditable ? "hover:bg-gray-200 hover:text-primaryAccent" : "cursor-auto"
          )}
          disabled={!isEditable}
          onClick={e => handleClick(e, "logValue")}
        >
          log(<span className="expression">{logValue}</span>)
        </button>
      </div>
      {isDemo() ? null : pausedOnHit ? (
        <button
          type="button"
          onClick={addComment}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
        >
          Add a comment
        </button>
      ) : (
        <button
          type="button"
          disabled={true}
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-gray-500 bg-gray-200"
          style={{ cursor: "auto" }}
        >
          Add a comment
        </button>
      )}
      {reactTooltip}
    </div>
  );
}

const connector = connect(
  (state: UIState, { breakpoint }: { breakpoint: any }) => ({
    executionPoint: getExecutionPoint(state),
    recordingId: getRecordingId(state),
    currentTime: selectors.getCurrentTime(state),
    analysisPoints: selectors.getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
  }),
  { createComment: actions.createComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PanelSummary);

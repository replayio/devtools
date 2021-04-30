import React, { Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

type Input = "condition" | "logValue";

type PanelSummaryProps = PropsFromRedux & {
  breakpoint: any;
  toggleEditingOn: () => void;
  isEditable: boolean;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
};

function PanelSummary({
  breakpoint,
  toggleEditingOn,
  isEditable,
  setInputToFocus,
  createComment,
  executionPoint,
  currentTime,
  analysisPoints,
}: PanelSummaryProps) {
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;
  const enableCommenting = analysisPoints?.find(
    point => point.point == executionPoint && point.time == currentTime
  );

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

  return (
    <>
      <div className="summary" onClick={e => handleClick(e, "logValue")}>
        <div className="options">
          {conditionValue ? (
            <button
              className="condition hover:bg-gray-100"
              type="button"
              onClick={e => handleClick(e, "condition")}
            >
              if (<span className="expression">{conditionValue}</span>)
            </button>
          ) : null}
          <button
            className="log hover:bg-gray-200"
            type="button"
            onClick={e => handleClick(e, "logValue")}
          >
            log(<span className="expression">{logValue}</span>)
          </button>
        </div>
        {enableCommenting ? (
          <button
            type="button"
            onClick={addComment}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      </div>
    </>
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
  { createComment: actions.createComment }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PanelSummary);

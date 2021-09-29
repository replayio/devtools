import classNames from "classnames";
import React, { Dispatch, SetStateAction } from "react";
import Popup from "reactjs-popup";
import { PopupProps } from "reactjs-popup/dist/types";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { getRecordingId, isDemo } from "ui/utils/environment";
import hooks from "ui/hooks";
import escapeHtml from "escape-html";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
const { prefs } = require("ui/utils/prefs");
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");

import "reactjs-popup/dist/index.css";
import "ui/components/reactjs-popup.css";

const popupProps: Omit<PopupProps, "children"> = {
  on: "hover",
  position: "right center",
  mouseEnterDelay: 200,
  mouseLeaveDelay: 200,
};

type Input = "condition" | "logValue";

type PanelSummaryProps = PropsFromRedux & {
  breakpoint: any;
  toggleEditingOn: () => void;
  setInputToFocus: Dispatch<SetStateAction<Input>>;
};

function getSyntaxHighlightedMarkup(string: string) {
  let markup = "";

  getCodeMirror().runMode(string, "javascript", (text: string, className: string | null) => {
    const openingTag = className ? `<span class="cm-${className}">` : "<span>";
    markup += `${openingTag}${escapeHtml(text)}</span>`;
  });

  return markup;
}

function SummaryRow({
  isEditable,
  handleClick,
  label,
  value,
}: {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent) => void;
  label: string | null;
  value: string;
}) {
  return (
    <div className="flex flex-row space-x-1 items-center">
      {label ? <div className="w-6 flex-shrink-0">{label}</div> : null}
      <button
        className={classNames(
          "group flex flex-row items-top space-x-1 p-0.5",
          !isEditable ? "bg-gray-200 cursor-auto" : "group-hover:text-primaryAccent"
        )}
        disabled={!isEditable}
        onClick={handleClick}
      >
        <span className="expression">
          <span
            className={
              isEditable
                ? "border-b border-dashed border-transparent group-hover:border-primaryAccent"
                : ""
            }
          >
            <div
              className="cm-s-mozilla font-mono overflow-hidden whitespace-pre"
              dangerouslySetInnerHTML={{
                __html: getSyntaxHighlightedMarkup(value) || "",
              }}
            />
          </span>
        </span>
        {isEditable ? (
          <MaterialIcon
            className="opacity-0 group-hover:opacity-100 "
            style={{ fontSize: "0.75rem", lineHeight: "0.75rem" }}
          >
            edit
          </MaterialIcon>
        ) : null}
      </button>
    </div>
  );
}

function Condition({
  isEditable,
  handleClick,
  conditionValue,
}: {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent, input: Input) => void;
  conditionValue: string;
}) {
  return (
    <SummaryRow
      label="if"
      value={conditionValue}
      handleClick={e => handleClick(e, "condition")}
      {...{ isEditable }}
    />
  );
}

function Log({
  hasCondition,
  isEditable,
  handleClick,
  logValue,
}: {
  isEditable: boolean;
  handleClick: (event: React.MouseEvent, input: Input) => void;
  hasCondition: boolean;
  logValue: string;
}) {
  return (
    <SummaryRow
      label={hasCondition ? "log" : null}
      value={logValue}
      handleClick={e => handleClick(e, "logValue")}
      {...{ isEditable }}
    />
  );
}

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
  const didExceedMaxHitsEditable = analysisPoints && analysisPoints.length < prefs.maxHitsEditable;
  const isTeamDeveloper = recording ? recording.userRole !== "team-user" : false;
  const isEditable = !!didExceedMaxHitsEditable && !!isTeamDeveloper;

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
        <Popup
          trigger={
            <div className="flex items-center overflow-hidden space-x-2">
              <MaterialIcon className="text-xl">warning</MaterialIcon>
              <span className="warning-content overflow-hidden overflow-ellipsis whitespace-pre">{`This breakpoint was hit ${analysisPoints.length} times`}</span>
            </div>
          }
          {...popupProps}
        >
          This log is hidden from the console <br />
          because it was hit {prefs.maxHitsDisplayed}+ times
        </Popup>
      </div>
    );
  }

  const pausedOnHit = analysisPoints.find(
    point => point.point == executionPoint && point.time == currentTime
  );

  let tooltipContent: any = {};

  const content = (
    <div className="options items-center flex-col flex-grow" {...tooltipContent}>
      {conditionValue ? <Condition {...{ isEditable, handleClick, conditionValue }} /> : null}
      <Log {...{ isEditable, handleClick, logValue }} hasCondition={!!conditionValue} />
    </div>
  );

  return (
    <div className="summary space-x-2" onClick={e => handleClick(e, "logValue")}>
      {!didExceedMaxHitsEditable ? (
        <Popup trigger={content} {...popupProps}>
          This log is not editable because <br />
          it was hit {prefs.maxHitsEditable}+ times
        </Popup>
      ) : (
        content
      )}
      {!isTeamDeveloper ? (
        <Popup
          trigger={<span className="material-icons cursor-default text-gray-400">lock</span>}
          {...popupProps}
        >
          Editing logpoints is available for Developers in the Team plan
        </Popup>
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

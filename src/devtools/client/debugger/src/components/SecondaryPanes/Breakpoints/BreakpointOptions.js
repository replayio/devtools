import React from "react";
import actions from "../../../actions";
import { getContext } from "../../../selectors";
import { connect } from "../../../utils/connect";
import { memoize } from "lodash";

const highlightText = memoize(
  (text = "", editor) => {
    const node = document.createElement("div");
    editor.CodeMirror.runMode(text, "application/javascript", node);
    return { __html: node.innerHTML };
  },
  text => text
);

function BreakpointOptions({ breakpoint, editor, cx, selectSpecificLocation }) {
  const { logValue, condition } = breakpoint.options;
  // const lineText = breakpoint.text;

  // const selectBreakpoint = event => {
  //   event.preventDefault();
  //   selectSpecificLocation(cx, breakpoint.location);
  // };

  return (
    <div className="breakpoint-options">
      {/* <div className="breakpoint-content-line">
        <div className="img file" />
        <span
          className="breakpoint-label cm-s-mozilla devtools-monospace"
          onClick={selectBreakpoint}
          title={lineText}
        >
          <span dangerouslySetInnerHTML={highlightText(lineText, editor)} />
        </span>
      </div> */}
      <div className="breakpoint-content-log" title="Log Message">
        <div className="img log" />
        <span className="breakpoint-label cm-s-mozilla devtools-monospace">
          <span dangerouslySetInnerHTML={highlightText(logValue, editor)} />
        </span>
      </div>
      {condition ? (
        <div className="breakpoint-content-condition" title="Condition">
          <div className="condition-icon">?</div>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            <span dangerouslySetInnerHTML={highlightText(condition, editor)} />
          </span>
        </div>
      ) : null}
    </div>
  );
}

const mapStateToProps = state => ({
  cx: getContext(state),
});

export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
})(BreakpointOptions);

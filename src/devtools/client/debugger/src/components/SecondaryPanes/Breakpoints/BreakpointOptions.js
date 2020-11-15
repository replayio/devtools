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

  return (
    <div className="breakpoint-options">
      {condition ? (
        <span className="breakpoint-label cm-s-mozilla devtools-monospace">
          if(
          <span dangerouslySetInnerHTML={highlightText(condition, editor)} />)
        </span>
      ) : null}
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        log(
        <span dangerouslySetInnerHTML={highlightText(logValue, editor)} />)
      </span>
    </div>
  );
}

const mapStateToProps = state => ({
  cx: getContext(state),
});

export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
})(BreakpointOptions);

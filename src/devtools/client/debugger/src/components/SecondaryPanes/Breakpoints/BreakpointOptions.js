import React from "react";
import actions from "../../../actions";
import { getContext } from "../../../selectors";
import { connect } from "../../../utils/connect";
import memoize from "lodash/memoize";
import { RedactedSpan } from "ui/components/Redacted";

const highlightText = memoize(
  (text = "", editor) => {
    const node = document.createElement("div");
    editor.CodeMirror.runMode(text, "application/javascript", node);
    return { __html: node.innerHTML };
  },
  text => text
);

function Highlighted({ expression, editor }) {
  return <RedactedSpan dangerouslySetInnerHTML={highlightText(expression, editor)} />;
}

function BreakpointOptions({ breakpoint, editor, type }) {
  const { logValue, condition } = breakpoint.options;

  if (!condition) {
    return (
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        <Highlighted
          expression={type === "print-statement" ? breakpoint.text : logValue}
          editor={editor}
        />
      </span>
    );
  }

  return (
    <div className="breakpoint-options">
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        if(
        <Highlighted expression={condition} editor={editor} />)
      </span>

      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        log(
        <Highlighted expression={logValue} editor={editor} />)
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

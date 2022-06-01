import React from "react";
import memoize from "lodash/memoize";
import { RedactedSpan } from "ui/components/Redacted";
import type { Breakpoint as BreakpointType } from "../../../reducers/types";

const highlightText = memoize(
  (text = "", editor) => {
    const node = document.createElement("div");
    editor.CodeMirror.runMode(text, "application/javascript", node);
    return { __html: node.innerHTML };
  },
  text => text
);

function Highlighted({ expression, editor }: { expression: string; editor: $FixTypeLater }) {
  return <RedactedSpan dangerouslySetInnerHTML={highlightText(expression, editor)} />;
}

type $FixTypeLater = any;

type BreakpointProps = {
  type: "print-statement" | "breakpoint";
  breakpoint: BreakpointType;
  editor: $FixTypeLater;
};

function BreakpointOptions({ breakpoint, editor, type }: BreakpointProps) {
  const { logValue, condition } = breakpoint.options;

  if (!condition) {
    return (
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        <Highlighted
          expression={type === "print-statement" ? logValue! : breakpoint.text}
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
        <Highlighted expression={logValue!} editor={editor} />)
      </span>
    </div>
  );
}

export default BreakpointOptions;

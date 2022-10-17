import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import memoize from "lodash/memoize";
import React from "react";
import { Point } from "shared/client/types";
import { RedactedSpan } from "ui/components/Redacted";
import { getSelectedSource, getSourceContent } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import { getTextAtPosition } from "../../../utils/source";

const highlightText = memoize(
  (text = "", editor) => {
    const node = document.createElement("div");
    editor.CodeMirror.runMode(text, "application/javascript", node);
    return { __html: node.innerHTML };
  },
  text => text
);

function Highlighted({ expression, editor }: { expression: string; editor: SourceEditor }) {
  return <RedactedSpan dangerouslySetInnerHTML={highlightText(expression, editor)} />;
}

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
  editor: SourceEditor;
};

export default function BreakpointOptions({ breakpoint, editor, type }: BreakpointProps) {
  const selectedSource = useAppSelector(getSelectedSource);
  const sourceContent = useAppSelector(state =>
    selectedSource ? getSourceContent(state, selectedSource.id) : null
  );

  let children = null;
  if (type === "logpoint") {
    if (breakpoint.condition) {
      children = (
        <>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            if(
            <Highlighted expression={breakpoint.condition} editor={editor} />)
          </span>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            log(
            <Highlighted expression={breakpoint.content} editor={editor} />)
          </span>
        </>
      );
    } else {
      children = (
        <span className="breakpoint-label cm-s-mozilla devtools-monospace">
          <Highlighted expression={breakpoint.content} editor={editor} />
        </span>
      );
    }
  } else {
    if (sourceContent == null) {
      return null;
    }

    const text = getTextAtPosition(sourceContent, breakpoint.location);

    children = (
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        <Highlighted expression={text} editor={editor} />
      </span>
    );
  }

  return <div className="breakpoint-options">{children}</div>;
}

import React from "react";

import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { Point } from "shared/client/types";
import { getSelectedSource, getSourceContent } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import { getTextAtPosition } from "../../../utils/source";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

export default function BreakpointOptions({ breakpoint, type }: BreakpointProps) {
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
            <SyntaxHighlightedLine code={breakpoint.condition} />)
          </span>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            log(
            <SyntaxHighlightedLine code={breakpoint.content} />)
          </span>
        </>
      );
    } else {
      children = (
        <span className="breakpoint-label cm-s-mozilla devtools-monospace">
          <SyntaxHighlightedLine code={breakpoint.content} />
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
        <SyntaxHighlightedLine code={text} />
      </span>
    );
  }

  return <div className="breakpoint-options">{children}</div>;
}

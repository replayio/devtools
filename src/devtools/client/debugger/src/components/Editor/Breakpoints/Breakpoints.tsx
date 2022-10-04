import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { getFirstVisibleBreakpoints } from "devtools/client/debugger/src/selectors";
import SourceEditor from "devtools/client/debugger/src/utils/editor/source-editor";
import { getSelectedSource } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import Breakpoint from "./Breakpoint";

export default function Breakpoints({ cx, editor }: { cx: Context; editor: SourceEditor }) {
  const breakpoints = useAppSelector(getFirstVisibleBreakpoints);
  const selectedSource = useAppSelector(getSelectedSource);

  if (!selectedSource || !breakpoints) {
    return null;
  }

  // We only need to render one gutter breakpoint per line.
  const renderedLines = new Set();

  return (
    <div>
      {breakpoints.map(breakpoint => {
        if (renderedLines.has(breakpoint.location.line)) {
          return null;
        }

        renderedLines.add(breakpoint.location.line);

        return (
          <Breakpoint
            cx={cx}
            key={breakpoint.id}
            breakpoint={breakpoint}
            selectedSource={selectedSource}
            editor={editor}
          />
        );
      })}
    </div>
  );
}

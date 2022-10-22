import useCurrentPause from "@bvaughn/src/hooks/useCurrentPause";
import { SourceId } from "@replayio/protocol";
import { Suspense } from "react";

import styles from "./CurrentLineHighlight.module.css";

type Props = {
  lineNumber: number;
  sourceId: SourceId;
};

export default function CurrentLineHighlight(props: Props) {
  return (
    <Suspense>
      <CurrentLineHighlightSuspends {...props} />
    </Suspense>
  );
}
function CurrentLineHighlightSuspends({ lineNumber, sourceId }: Props) {
  const pauseData = useCurrentPause();
  if (pauseData !== null && pauseData.data && pauseData.data.frames) {
    // TODO [source viewer]
    // Top frame is not necessarily the selected frame.
    // Look at Holger's new SelectedFrameContext (PR 7987)
    const topFrame = pauseData.data.frames[0];
    if (topFrame) {
      if (
        topFrame.location.find(
          location => location.line === lineNumber && location.sourceId === sourceId
        )
      ) {
        return <div className={styles.CurrentLine} data-test-name="CurrentLineHighlight" />;
      }
    }
  }

  return null;
}

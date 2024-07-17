import { CallStack, Frame, FrameId } from "@replayio/protocol";
import { Suspense, memo } from "react";

import Loader from "replay-next/components/Loader";

import Source from "./Source";
import styles from "./StackRenderer.module.css";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function StackRenderer({ frames, stack }: { frames: Frame[]; stack: CallStack }) {
  if (frames == null || stack == null) {
    return null;
  }

  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.StackGrid} data-test-name="Stack">
        {stack.map((frameId, index) => (
          <StackFrameRenderer key={index} frameId={frameId} frames={frames} />
        ))}
      </div>
    </Suspense>
  );
}

function StackFrameRenderer({ frameId, frames }: { frameId: FrameId; frames: Frame[] }) {
  const frame = frames.find(frame => frame.frameId === frameId);
  if (frame == null) {
    return null;
  }

  if (frame.location.length === 0) {
    return <div className={styles.Frame}>{frame.functionName}</div>;
  } else {
    return (
      <>
        <span>{frame.originalFunctionName || frame.functionName || "(anonymous)"}</span>
        <span>@</span>
        <span className={styles.SourceColumn}>
          <Source className={styles.Source} locations={frame.location} />
        </span>
      </>
    );
  }
}

export default memo(StackRenderer);

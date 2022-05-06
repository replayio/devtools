// Perform some analysis to construct the react devtools operations without depending
// on the backend which ran while recording.

import { ThreadFront } from "protocol/thread";
import { Annotation, ExecutionPoint } from "@recordreplay/protocol";
import { ArrayMap } from "./utils";

function getCommitOperations() {
  function getPersistentId(obj) {
    return __RECORD_REPLAY_PERSISTENT_ID__(obj);
  }

  try {
    const rv = [rendererID, getPersistentId(root), priorityLevel];
    return JSON.stringify(rv);
  } catch (e) {
    return "Exception: " + e.toString();
  }
}

async function getFiberCommitOperations(point: ExecutionPoint, time: number): Promise<number[] | undefined> {
  const pause = ThreadFront.ensurePause(point, time);
  const frames = await pause.getFrames();
  if (!frames || !frames.length) {
    return;
  }

  const text = `(${getCommitOperations})()`;

  const topFrameId = frames[0].frameId;
  const rv = await pause.evaluate(topFrameId, text, /* pure */ false);

  console.log("FiberCommit", rv, rv?.returned?.value);
}

export async function findReactDevtoolsOperations() {
  const hookAnnotations: ArrayMap<string, Annotation> = new ArrayMap();

  await ThreadFront.getAnnotations(( { annotations }) => {
    annotations.forEach(annotation => {
      if (annotation.kind == "react-devtools-hook") {
        hookAnnotations.add(annotation.contents, annotation);
      }
    });
  });

  const fiberCommits = hookAnnotations.map.get("commit-fiber-root");
  if (!fiberCommits) {
    return;
  }

  console.log("FiberCommits", fiberCommits);

  const commitOperations = await Promise.all(
    fiberCommits.map(({ point, time }) => getFiberCommitOperations(point, time))
  );
}

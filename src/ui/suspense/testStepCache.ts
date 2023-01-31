import { Frame } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";

import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
import { getFramesAsync } from "replay-next/src/suspense/FrameCache";
import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateSuspense, getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { AnnotatedTestStep, TestMetadata } from "ui/types";
import { gte } from "ui/utils/semver";

function getCypressTestStepSourceLocation8Plus(
  frames: Frame[],
  { isChaiAssertion = false }: { isChaiAssertion?: boolean }
) {
  // find the cypress marker frame
  const markerFrameIndex = frames.findIndex(
    (f: any, i: any, l: any) => f.functionName === "__stackReplacementMarker"
  );

  // and extract its sourceId
  const markerSourceId = frames[markerFrameIndex]?.functionLocation?.[0].sourceId;
  if (markerSourceId) {
    // slice the frames from the current to the marker frame and reverse
    // it so the user frames are on top
    const userFrames = frames?.slice(0, markerFrameIndex).reverse();

    const frame = userFrames.find((f, i, l) => {
      if (isChaiAssertion) {
        // if this is a chai assertion, the invocation was synchronous in this
        // call stack so we're looking from the top for the first frame that
        // isn't from the same source as the marker to identify the user frame
        // that invoke it
        return f.functionLocation?.every(fl => fl.sourceId !== markerSourceId);
      } else {
        // for enqueued assertions, search from the top for the first frame from the same source
        // as the marker (which should be cypress_runner.js) and return it
        return l[i + 1]?.functionLocation?.some(fl => fl.sourceId === markerSourceId);
      }
    });

    return frame?.location[frame.location.length - 1];
  }
}

function getCypressTestStepSourceLocationBelow8(frames: Frame[]) {
  // find the cypress marker frame
  const markerFrameIndex = frames.findIndex((f: any, i: any, l: any) =>
    f.functionName?.startsWith("injectHtmlAndBootAlpine")
  );

  // the user frame should be right before injectHtmlAndBootAlpine
  const frame = frames[markerFrameIndex - 1];

  return frame?.location[frame.location.length - 1];
}

export async function getTestStepSourceLocationAsync(
  client: ReplayClientInterface,
  metadata: TestMetadata | undefined,
  step: AnnotatedTestStep | null
) {
  const runner = metadata?.runner?.name;
  const runnerVersion = metadata?.runner?.version;

  if (runner === "cypress" && runnerVersion) {
    const isChaiAssertion = step?.name === "assert" && !step.annotations.enqueue;
    const annotation = isChaiAssertion ? step.annotations.start : step?.annotations.enqueue;

    if (annotation?.point && annotation.time != null) {
      const pauseId = await getPauseIdAsync(client, annotation.point, annotation.time);
      const frames = await getFramesAsync(client, pauseId);

      if (frames) {
        if (gte(runnerVersion, "8.0.0")) {
          return getCypressTestStepSourceLocation8Plus(frames, {
            isChaiAssertion,
          });
        } else {
          return getCypressTestStepSourceLocationBelow8(frames);
        }
      }
    }
  }
}

export function getCypressConsolePropsSuspense(
  client: ReplayClientInterface,
  step: AnnotatedTestStep | null
) {
  const {
    point,
    time,
    message: { logVariable } = { logVariable: undefined },
  } = step?.annotations.end || {};

  if (!logVariable || !point || time == null) {
    return;
  }

  const endPauseId = getPauseIdSuspense(client, point, time);
  const frames = getFramesSuspense(client, endPauseId);
  const callerFrameId = frames?.[1]?.frameId;

  if (callerFrameId) {
    const { returned: logResult } = evaluateSuspense(
      client,
      endPauseId,
      callerFrameId,
      logVariable
    );

    if (logResult?.object) {
      const logObject = getObjectWithPreviewSuspense(client, endPauseId, logResult.object);
      const consolePropsProperty = logObject.preview?.properties?.find(
        p => p.name === "consoleProps"
      );

      if (consolePropsProperty?.object) {
        const consoleProps = getObjectWithPreviewSuspense(
          client,
          endPauseId,
          consolePropsProperty.object,
          true
        );

        const sanitized = cloneDeep(consoleProps);
        if (sanitized?.preview?.properties) {
          sanitized.preview.properties = sanitized.preview.properties.filter(
            p => p.name !== "Snapshot"
          );

          // suppress the prototype entry in the properties output
          sanitized.preview.prototypeId = undefined;
        }

        return {
          consoleProps: sanitized,
          pauseId: endPauseId,
        };
      }
    }
  }

  return {
    consoleProps: undefined,
    pauseId: endPauseId,
  };
}

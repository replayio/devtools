import cloneDeep from "lodash/cloneDeep";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { pauseEvaluationsCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { AnnotatedTestStep } from "ui/components/TestSuite/types";

export function getConsolePropsCountSuspense(
  client: ReplayClientInterface,
  step: AnnotatedTestStep
) {
  const { consoleProps } = getConsolePropsSuspense(client, step) || {};
  if (consoleProps) {
    return consoleProps.preview?.properties?.find(({ name }) => name === "Elements")?.value ?? null;
  }

  return null;
}

export function getConsolePropsSuspense(client: ReplayClientInterface, step: AnnotatedTestStep) {
  if (step.data.annotations.end == null) {
    return null;
  }

  const {
    point,
    time,
    message: { logVariable } = { logVariable: undefined },
  } = step.data.annotations.end;

  if (!logVariable || !point || time == null) {
    return;
  }

  const endPauseId = pauseIdCache.read(client, point, time);
  const frames = framesCache.read(client, endPauseId);
  const callerFrameId = frames?.[1]?.frameId;

  if (callerFrameId) {
    const { returned: logResult } = pauseEvaluationsCache.read(
      client,
      endPauseId,
      callerFrameId,
      logVariable,
      undefined
    );

    if (logResult?.object) {
      const logObject = objectCache.read(client, endPauseId, logResult.object, "canOverflow");
      const consolePropsProperty = logObject.preview?.properties?.find(
        ({ name }) => name === "consoleProps"
      );

      if (consolePropsProperty?.object) {
        const consoleProps = objectCache.read(
          client,
          endPauseId,
          consolePropsProperty.object,
          "full"
        );

        const sanitized = cloneDeep(consoleProps);
        if (sanitized?.preview?.properties) {
          sanitized.preview.properties = sanitized.preview.properties.filter(
            ({ name }) => name !== "Snapshot"
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

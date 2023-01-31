import cloneDeep from "lodash/cloneDeep";

import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateSuspense, getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { AnnotatedTestStep } from "ui/types";

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

  if (!callerFrameId) {
    return;
  }

  const { returned: logResult } = evaluateSuspense(client, endPauseId, callerFrameId, logVariable);

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

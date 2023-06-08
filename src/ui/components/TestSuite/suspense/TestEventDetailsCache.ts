import { Frame, PauseId, Object as ProtocolObject, TimeStampedPoint } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { createCache } from "suspense";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export type Type = {
  count: number | null;
  pauseId: PauseId;
  props: ProtocolObject | null;
};

export const TestEventDetailsCache = createCache<
  [client: ReplayClientInterface, timeStampedPoint: TimeStampedPoint, variable: string],
  Type
>({
  debugLabel: "TestEventDetailsCache",
  getKey: ([client, timeStampedPoint, variable]) => `${timeStampedPoint.point}:${variable}`,
  load: async ([client, timeStampedPoint, variable]) => {
    const endPauseId = await pauseIdCache.readAsync(
      client,
      timeStampedPoint.point,
      timeStampedPoint.time
    );
    let frames: Frame[] | undefined;
    try {
      frames = await framesCache.readAsync(client, endPauseId);
    } catch (error) {
      // TODO [FE-1555] RUN currently throws in some cases;
      // degrade gracefully in this case by just disabling the details panel
      console.error(error);
    }

    const callerFrameId = frames?.[1]?.frameId;
    if (callerFrameId) {
      const { returned: logResult } = await pauseEvaluationsCache.readAsync(
        client,
        endPauseId,
        callerFrameId,
        variable,
        undefined
      );

      if (logResult?.object) {
        const logObject = await objectCache.readAsync(
          client,
          endPauseId,
          logResult.object,
          "canOverflow"
        );
        const consolePropsProperty = logObject.preview?.properties?.find(
          ({ name }) => name === "consoleProps"
        );

        if (consolePropsProperty?.object) {
          const consoleProps = await objectCache.readAsync(
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

          const elementsProp = sanitized.preview?.properties?.find(
            ({ name }) => name === "Elements"
          );
          const count = (elementsProp?.value as number) ?? null;

          return {
            count,
            pauseId: endPauseId,
            props: sanitized,
          };
        }
      }
    }

    return {
      count: null,
      pauseId: endPauseId,
      props: null,
    };
  },
});

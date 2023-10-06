import { Frame, PauseId, Object as ProtocolObject, TimeStampedPoint } from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { Cache, createCache } from "suspense";

import { createAnalysisCache } from "replay-next/src/suspense/AnalysisCache";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { hitPointsCache } from "replay-next/src/suspense/HitPointsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

export type TestEventDetailsEntry = TimeStampedPoint & {
  count: number | null;
  pauseId: PauseId;
  props: ProtocolObject | null;
};

export const testEventDetailsCache2Internal = createAnalysisCache<
  TimeStampedPoint,
  [timeStampedPoint: TimeStampedPoint | null, variable: string]
>(
  "TestEventDetailsCache2Internal",
  (timeStampedPoint, variable) => `${timeStampedPoint?.point}:${variable}`,
  (client, begin, end, timeStampedPoint, variable) => (timeStampedPoint ? [timeStampedPoint] : []),
  (client, points, timeStampedPoint, variable) => ({
    selector: {
      kind: "points",
      points: points.map(p => p.point),
    },
    expression: variable,
    frameIndex: 1,
  }),
  point => point
);

export const testEventDetailsCache2: Cache<
  [
    client: ReplayClientInterface,
    timeStampedPoint: TimeStampedPoint | null,
    variable: string | null
  ],
  TestEventDetailsEntry | null
> = createCache({
  debugLabel: "TestEventDetailsCache2",
  getKey: ([client, timeStampedPoint, variable]) => `${timeStampedPoint?.point}:${variable}`,
  async load([client, timeStampedPoint, variable]) {
    if (!timeStampedPoint || !variable) {
      console.log("Bailing out of testEventDetailsCache2: ", timeStampedPoint, variable);
      return null;
    }

    const variableNameInArray = `[${variable}]`;

    try {
      console.log("testEventDetailsCache2 fetching: ", timeStampedPoint, variable);
      console.time(`testEventDetails2:pointsAndResult:${timeStampedPoint.point}}`);
      const pointsRes = await testEventDetailsCache2Internal.pointsIntervalCache.readAsync(
        BigInt(timeStampedPoint.point),
        BigInt(timeStampedPoint.point),
        client,
        timeStampedPoint,
        variableNameInArray
      );

      const result = await testEventDetailsCache2Internal.resultsCache.readAsync(
        timeStampedPoint.point,
        timeStampedPoint,
        variableNameInArray
      );

      console.timeEnd(`testEventDetails2:pointsAndResult:${timeStampedPoint.point}}`);
      console.log("Actual result: ", result);

      const { pauseId } = result;
      const [firstValue] = result.values;

      if (firstValue?.object) {
        const logObject = await objectCache.readAsync(
          client,
          pauseId,
          firstValue.object,
          "canOverflow"
        );
        const consolePropsProperty = logObject.preview?.properties?.find(
          ({ name }) => name === "consoleProps"
        );

        if (consolePropsProperty?.object) {
          const consoleProps = await objectCache.readAsync(
            client,
            pauseId,
            consolePropsProperty.object,
            "full"
          );

          const sanitized = cloneDeep(consoleProps);

          console.log("Console props: ", timeStampedPoint.point, sanitized);
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
            ...timeStampedPoint,
            count,
            pauseId,
            props: sanitized,
          };
        }
      }

      return {
        ...timeStampedPoint,
        count: null,
        pauseId: result.pauseId,
        props: null,
      };
    } catch (err) {
      console.error("event details error: ", err);
      return null;
    }
  },
});

export const TestEventDetailsCache = createCache<
  [client: ReplayClientInterface, timeStampedPoint: TimeStampedPoint, variable: string],
  TestEventDetailsEntry
>({
  debugLabel: "TestEventDetailsCache",
  getKey: ([client, timeStampedPoint, variable]) => `${timeStampedPoint.point}:${variable}`,
  load: async ([client, timeStampedPoint, variable]) => {
    console.group("Test event details: ", timeStampedPoint);
    console.time("testEventDetails:hitPoints");
    const hitPointsWithFrame = await client.findPoints({
      kind: "points",
      points: [timeStampedPoint.point],
    });
    console.timeEnd("testEventDetails:hitPoints");
    console.time("testEventDetails:pauseId");
    const endPauseId = await pauseIdCache.readAsync(
      client,
      timeStampedPoint.point,
      timeStampedPoint.time
    );
    console.timeEnd("testEventDetails:pauseId");
    let frames: Frame[] | undefined;
    console.time("testEventDetails:frames");
    try {
      frames = await framesCache.readAsync(client, endPauseId);
    } catch (error) {
      // TODO [FE-1555] RUN currently throws in some cases;
      // degrade gracefully in this case by just disabling the details panel
      console.error(error);
    }
    console.timeEnd("testEventDetails:frames");

    console.time("testEventDetails:pointStack");
    const pointStack = await client.getPointStack(timeStampedPoint.point, 5);
    console.log("Point stack: ", pointStack);
    console.timeEnd("testEventDetails:pointStack");

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
        console.time("testEventDetails:object");
        const logObject = await objectCache.readAsync(
          client,
          endPauseId,
          logResult.object,
          "canOverflow"
        );
        console.timeEnd("testEventDetails:object");
        const consolePropsProperty = logObject.preview?.properties?.find(
          ({ name }) => name === "consoleProps"
        );

        if (consolePropsProperty?.object) {
          console.time("testEventDetails:consoleProps");
          const consoleProps = await objectCache.readAsync(
            client,
            endPauseId,
            consolePropsProperty.object,
            "full"
          );
          console.timeEnd("testEventDetails:consoleProps");

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
            ...timeStampedPoint,
            count,
            pauseId: endPauseId,
            props: sanitized,
          };
        }
      }
    }
    console.groupEnd();

    return {
      ...timeStampedPoint,
      count: null,
      pauseId: endPauseId,
      props: null,
    };
  },
});

import {
  ExecutionPoint,
  Frame,
  PauseId,
  Property,
  Object as ProtocolObject,
  TimeStampedPoint,
} from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import {
  Cache,
  ExternallyManagedCache,
  IntervalCache,
  createCache,
  createExternallyManagedCache,
} from "suspense";

import { NodeInfo } from "devtools/client/inspector/markup/reducers/markup";
import { createAnalysisCache } from "replay-next/src/suspense/AnalysisCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { hitPointsCache } from "replay-next/src/suspense/HitPointsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import {
  TestRecording,
  UserActionEvent,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { boxModelCache, processedNodeDataCache } from "ui/suspense/nodeCaches";

export type TestEventDetailsEntry = TimeStampedPoint & {
  count: number | null;
  pauseId: PauseId;
  props: ProtocolObject | null;
};

export type TestEventDomNodeDetails = TimeStampedPoint & {
  pauseId: PauseId;
  domNode: NodeInfo | null;
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

export const testEventDetailsCache3Internal = createAnalysisCache<
  TimeStampedPoint,
  [timeStampedPoints: TimeStampedPoint[], variable: string]
>(
  "TestEventDetailsCache2Internal",
  (timeStampedPoint, variable) => `${variable}`,
  (client, begin, end, timeStampedPoints, variable) => timeStampedPoints,
  (client, points, timeStampedPoints, variable) => ({
    selector: {
      kind: "points",
      points: points.map(p => p.point),
    },
    expression: variable,
    frameIndex: 1,
  }),
  point => point
);

export const testEventDetailsCache3IntervalCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, testRecording: TestRecording, enabled: boolean],
  TestEventDetailsEntry
>({
  debugLabel: "TestEventDetailsCache3",
  getPointForValue: (event: TestEventDetailsEntry) => event.point,
  async load(begin, end, replayClient, testRecording, enabled) {
    // console.log("testEventDetailsCache3 loading: ", begin, end, enabled);
    if (!enabled) {
      return [];
    }
    const { beforeAll, beforeEach, main, afterEach, afterAll } = testRecording.events;
    const allEvents = beforeAll.concat(beforeEach, main, afterEach, afterAll);

    const filteredEvents: UserActionEvent[] = allEvents.filter((e): e is UserActionEvent => {
      if (isUserActionTestEvent(e)) {
        // Same as TestStepDetails.tsx
        if (e.data.timeStampedPoints.result && e.data.resultVariable) {
          const isInFocusRange = isExecutionPointsWithinRange(
            e.data.timeStampedPoints.result.point,
            begin,
            end
          );
          return isInFocusRange;
        }
      }

      return false;
    });

    console.log("All step events: ", allEvents, "filtered events: ", filteredEvents);

    if (filteredEvents.length === 0) {
      return [];
    }

    // We assume that _all_ events have the same `resultVariable` field. Per Ryan, this is a safe assumption.
    // The field may change across plugin versions, but all events in a recording will have the same value.
    // This _should_ generally be `"arguments[4]"` based on the current plugin.
    const stepDetailsVariable = filteredEvents[0].data.resultVariable;

    const variableNameWithConsoleProps = `${stepDetailsVariable}.consoleProps`;
    const testResultPoints = filteredEvents.map(e => e.data.timeStampedPoints.result!);

    const readPointsTimeLabel = `Fetching all points and results (${begin}-${end})`;
    console.time(readPointsTimeLabel);
    await testEventDetailsCache3Internal.pointsIntervalCache.readAsync(
      BigInt(begin),
      BigInt(end),
      replayClient,
      testResultPoints,
      variableNameWithConsoleProps
    );
    console.timeEnd(readPointsTimeLabel);

    const readResultsTimeLabel = `Reading all results (${begin}-${end})`;
    console.time(readResultsTimeLabel);
    const allEvalResults = await Promise.all(
      testResultPoints.map(async timeStampedPoint => {
        return await testEventDetailsCache3Internal.resultsCache.readAsync(
          timeStampedPoint.point,
          // I _think_ we don't need or care about this array to read one value
          [],
          variableNameWithConsoleProps
        );
      })
    );
    console.timeEnd(readResultsTimeLabel);

    // console.log("All eval results: ", allEvalResults);

    const processedLabel = `Processing all results (${begin}-${end})`;
    console.time(processedLabel);
    const processedResults: TestEventDetailsEntry[] = await Promise.all(
      allEvalResults.map(async result => {
        const { pauseId, point, time } = result;
        const timeStampedPoint = { point, time };
        const [consolePropsValue] = result.values;
        // const [firstValue] = result.values;

        if (consolePropsValue?.object) {
          // if (firstValue?.object) {
          // const logObject = await objectCache.readAsync(
          //   client,
          //   pauseId,
          //   firstValue.object,
          //   "canOverflow"
          // );
          // const consolePropsProperty = logObject.preview?.properties?.find(
          //   ({ name }) => name === "consoleProps"
          // );

          if (consolePropsValue?.object) {
            const consoleProps = await objectCache.readAsync(
              replayClient,
              pauseId,
              consolePropsValue.object,
              "full"
            );

            const sanitized = cloneDeep(consoleProps);

            // console.log("Console props: ", timeStampedPoint.point, sanitized);
            if (sanitized?.preview?.properties) {
              sanitized.preview.properties = sanitized.preview.properties.filter(
                ({ name }) => name !== "Snapshot"
              );

              // suppress the prototype entry in the properties output
              sanitized.preview.prototypeId = undefined;
            }

            // Kick this off, but don't block this cache read on it
            fetchAndCachePossibleDomNode(replayClient, sanitized, pauseId, timeStampedPoint);

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
      })
    );
    console.timeEnd(processedLabel);

    for (const processedResult of processedResults) {
      testEventDetailsCache3ResultsCache.cacheValue(processedResult, processedResult.point);
    }

    // console.log("Processed step details results: ", begin, end, processedResults);
    return processedResults;
  },
});

export const testEventDetailsCache3ResultsCache: ExternallyManagedCache<
  [executionPoint: ExecutionPoint],
  TestEventDetailsEntry
> = createExternallyManagedCache({
  debugLabel: `TestEventDetails3ResultsCache`,
  getKey: ([executionPoint, ...params]) => {
    return executionPoint;
  },
});

export const testEventDomNodeCache: ExternallyManagedCache<
  [executionPoint: ExecutionPoint],
  TestEventDomNodeDetails
> = createExternallyManagedCache({
  debugLabel: `TestEventDetails3ResultsCache`,
  getKey: ([executionPoint, ...params]) => {
    return executionPoint;
  },
});

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

    // const variableNameInArray = variable; // `[${variable}]`;
    const variableNameWithConsoleProps = `${variable}.consoleProps`;

    try {
      console.log("testEventDetailsCache2 fetching: ", timeStampedPoint, variable);
      console.time(`testEventDetails2:pointsAndResult:${timeStampedPoint.point}}`);
      const pointsRes = await testEventDetailsCache2Internal.pointsIntervalCache.readAsync(
        BigInt(timeStampedPoint.point),
        BigInt(timeStampedPoint.point),
        client,
        timeStampedPoint,
        variableNameWithConsoleProps
      );

      const result = await testEventDetailsCache2Internal.resultsCache.readAsync(
        timeStampedPoint.point,
        timeStampedPoint,
        variableNameWithConsoleProps
      );

      console.timeEnd(`testEventDetails2:pointsAndResult:${timeStampedPoint.point}}`);
      console.log("Actual result: ", result);

      const { pauseId } = result;
      const [consolePropsValue] = result.values;
      // const [firstValue] = result.values;

      if (consolePropsValue?.object) {
        // if (firstValue?.object) {
        // const logObject = await objectCache.readAsync(
        //   client,
        //   pauseId,
        //   firstValue.object,
        //   "canOverflow"
        // );
        // const consolePropsProperty = logObject.preview?.properties?.find(
        //   ({ name }) => name === "consoleProps"
        // );

        if (consolePropsValue?.object) {
          const consoleProps = await objectCache.readAsync(
            client,
            pauseId,
            consolePropsValue.object,
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

          const propNamesWithPotentialElements = ["Yielded", "Applied To"] as const;
          const propsWithPotentialElements =
            sanitized.preview?.properties?.filter(({ name }) =>
              propNamesWithPotentialElements.includes(name)
            ) ?? [];

          propsWithPotentialElements.map(async prop => {
            // kick this off now, but don't wait for it
            if (prop?.object) {
              // console.log("Fetching element preview: ", prop);
              const cachedPropObject = await objectCache.readAsync(
                client,
                pauseId,
                prop.object,
                "canOverflow"
              );
              console.log("Cached preview: ", prop, cachedPropObject);
              if (cachedPropObject.className === "Array") {
                // Probably multiple DOM nodes. Pre-fetch these too.
                cachedPropObject.preview?.properties?.map(async (prop: Property) => {
                  if (prop?.object) {
                    // console.log("Fetching element preview: ", prop);
                    const cachedPropObject = await objectCache.readAsync(
                      client,
                      pauseId,
                      prop.object,
                      "canOverflow"
                    );
                    console.log("Cached nested array preview: ", prop, cachedPropObject);
                  }
                });
              }
            }
          });

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

async function fetchAndCachePossibleDomNode(
  replayClient: ReplayClientInterface,
  sanitized: ProtocolObject,
  pauseId: string,
  timeStampedPoint: TimeStampedPoint
) {
  const propNamesWithPotentialElements = ["Yielded", "Applied To"] as const;
  const propsWithPotentialElements =
    sanitized.preview?.properties?.filter(({ name }) =>
      propNamesWithPotentialElements.includes(name)
    ) ?? [];

  const possibleDomNodes = await Promise.all(
    propsWithPotentialElements.map(async prop => {
      if (!prop.object) {
        return null;
      }

      // console.log("Fetching element preview: ", prop);
      const cachedPropObject = await objectCache.readAsync(
        replayClient,
        pauseId,
        prop.object,
        "canOverflow"
      );

      if (cachedPropObject.className === "Array") {
        // Probably multiple DOM nodes. Pre-fetch these too.
        const yieldedPropsWithObjects = (cachedPropObject.preview?.properties ?? []).filter(
          prop => prop.object
        );
        const yieldedDomNodes = await Promise.all(
          yieldedPropsWithObjects.map(async (prop: Property) => {
            // console.log("Fetching element preview: ", prop);
            const cachedPropObject = await objectCache.readAsync(
              replayClient,
              pauseId,
              prop.object!,
              "canOverflow"
            );
            return cachedPropObject;
          })
        );
        return yieldedDomNodes[0] ?? null;
      } else {
        return cachedPropObject;
      }
    })
  );

  const firstDomNode = possibleDomNodes.find(
    el => !!el && el.className !== "Object" && el.className.includes("Element")
  );
  let nodeInfo: NodeInfo | null = null;

  // console.log("First DOM node for ", timeStampedPoint, firstDomNode);

  if (firstDomNode) {
    boxModelCache.prefetch(replayClient, pauseId, firstDomNode.objectId);
    nodeInfo = await processedNodeDataCache.readAsync(replayClient, pauseId, firstDomNode.objectId);
  }

  const domNodeDetails: TestEventDomNodeDetails = {
    ...timeStampedPoint,
    pauseId,
    domNode: nodeInfo,
  };

  testEventDomNodeCache.cacheValue(domNodeDetails, domNodeDetails.point);
}

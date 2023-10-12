import {
  ExecutionPoint,
  PauseId,
  Property,
  Object as ProtocolObject,
  RunEvaluationResult,
  TimeStampedPoint,
} from "@replayio/protocol";
import cloneDeep from "lodash/cloneDeep";
import { ExternallyManagedCache, createExternallyManagedCache } from "suspense";

import { NodeInfo } from "devtools/client/inspector/markup/reducers/markup";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData, setPointAndTimeForPauseId } from "replay-next/src/suspense/PauseCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { compareExecutionPoints, isExecutionPointsWithinRange } from "replay-next/src/utils/time";
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

// The interval cache is used by `<Panel>` to fetch all of the step details and DOM node data for a single test.
// `<Panel>` will kick this off when it renders, and then the cache will fetch all of the data in the background.
export const testEventDetailsIntervalCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, testRecording: TestRecording, enabled: boolean],
  TestEventDetailsEntry
>({
  debugLabel: "TestEventDetailsCache3",
  getPointForValue: (event: TestEventDetailsEntry) => event.point,
  getKey(client, testRecording, enabled) {
    const key = `${testRecording.id}-${enabled}`;

    return key;
  },
  async load(begin, end, replayClient, testRecording, enabled, options) {
    if (!enabled) {
      return [];
    }

    // This should be the same ordering used by `<Panel>` to render the steps.
    const { beforeAll, beforeEach, main, afterEach, afterAll } = testRecording.events;
    const allEvents = beforeAll.concat(beforeEach, main, afterEach, afterAll);

    // Limit this down to just user actions that have valid results.
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

    if (filteredEvents.length === 0) {
      return [];
    }

    // We assume that _all_ events have the same `resultVariable` field. Per Ryan, this is a safe assumption.
    // The field may change across plugin versions, but all events in a recording will have the same value.
    // This _should_ generally be `"arguments[4]"` based on the current plugin.
    const stepDetailsVariable = filteredEvents[0].data.resultVariable;

    const variableNameWithConsoleProps = `${stepDetailsVariable}.consoleProps`;
    const testResultPoints = filteredEvents.map(e => e.data.timeStampedPoints.result!);

    const sources = await sourcesByIdCache.readAsync(replayClient);

    const evalResults: RunEvaluationResult[] = [];

    // Any focus range errors here will bubble up to the parent focus cache,
    // which will retry the load if needed later.
    await replayClient.runEvaluation(
      {
        selector: {
          kind: "points",
          points: testResultPoints.map(p => p.point),
        },
        expression: variableNameWithConsoleProps,
        frameIndex: 1,
        fullPropertyPreview: true,
        limits: { begin, end },
      },
      results => {
        // This logic copy-pasted from AnalysisCache.ts
        for (const result of results) {
          // Immediately cache pause ID and data so we have it available for reuse
          setPointAndTimeForPauseId(result.pauseId, result.point);
          cachePauseData(replayClient, sources, result.pauseId, result.data);
        }
        // Collect them all so we process them in a single batch
        evalResults.push(...results);
      }
    );

    evalResults.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

    // We need to reformat the raw analysis data to extract details on the "step details" object.
    const processedResults: TestEventDetailsEntry[] = await Promise.all(
      evalResults.map(async result => {
        const { pauseId, point: timeStampedPoint, returned } = result;
        const consolePropsValue = returned;

        if (consolePropsValue?.object) {
          // This should already be cached because of `runEvaluation` returned nested previews.
          const consoleProps = await objectCache.readAsync(
            replayClient,
            pauseId,
            consolePropsValue.object,
            "full"
          );

          // We're going to reformat this to filter out a couple properties and displayed values
          const sanitized = cloneDeep(consoleProps);

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

        return {
          ...timeStampedPoint,
          count: null,
          pauseId: result.pauseId,
          props: null,
        };
      })
    );

    for (const processedResult of processedResults) {
      // Store each result in the externally managed cache, to make it easy for the UI
      // to look up a single cache entry by point without needing all the other arguments.
      testEventDetailsResultsCache.cacheValue(processedResult, processedResult.point);
    }

    return processedResults;
  },
});

// We use externally managed caches for the step details and DOM node data
// to make it easy for the Details and StepRow components to look up the right
// item via just the execution point, without needing any of the other args.
export const testEventDetailsResultsCache: ExternallyManagedCache<
  [executionPoint: ExecutionPoint],
  TestEventDetailsEntry
> = createExternallyManagedCache({
  debugLabel: `TestEventDetailsResultsCache`,
  getKey: ([executionPoint, ...params]) => {
    return executionPoint;
  },
});

export const testEventDomNodeCache: ExternallyManagedCache<
  [executionPoint: ExecutionPoint],
  TestEventDomNodeDetails
> = createExternallyManagedCache({
  debugLabel: `TestEventDetailsResultsCache`,
  getKey: ([executionPoint, ...params]) => {
    return executionPoint;
  },
});

// Pre-fetch the DOM node for this step, if possible.
// Note this runs somewhat in the background and is not awaited,
// and mutates the `testEventDomNodeCache` with the results.
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

  // Try to make sure this looks like a DOM node
  const firstDomNode = possibleDomNodes.find(
    el => !!el && el.className !== "Object" && el.preview?.node
  );

  let nodeInfo: NodeInfo | null = null;

  if (firstDomNode) {
    // Kick off a fetch for the box model now, so we have that cached when we try to highlight this node
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

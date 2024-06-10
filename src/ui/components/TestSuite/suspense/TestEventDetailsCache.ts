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

import { Element, elementCache } from "replay-next/components/elements/suspense/ElementCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { cachePauseData, setPointAndTimeForPauseId } from "replay-next/src/suspense/PauseCache";
import { Source, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import {
  findProtocolObjectProperty,
  findProtocolObjectPropertyValue,
} from "replay-next/src/utils/protocol";
import { compareExecutionPoints, isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import {
  RecordingTestMetadataV3,
  TestRecording,
  UserActionEvent,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { boundingRectsCache } from "ui/suspense/nodeCaches";

export type TestEventDetailsEntry = TimeStampedPoint & {
  count: number | null;
  pauseId: PauseId | null;
  props: ProtocolObject | null;
  testEvent: UserActionEvent;
};

export type TestEventDomNodeDetails = TimeStampedPoint & {
  pauseId: PauseId;
  domNodes: Element[];
  testEvent: UserActionEvent;
};

let getPlaywrightTestStepDomNodesString: string | null = null;

async function lazyImportExpression() {
  const module = await import("../utils/playwrightStepDomNodes");
  getPlaywrightTestStepDomNodesString = module.getPlaywrightTestStepDomNodes.toString();
}

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

    const { testRunnerName } = testRecording;

    // This should be the same ordering used by `<Panel>` to render the steps.
    const { beforeAll, beforeEach, main, afterEach, afterAll } = testRecording.events;
    const allEvents = beforeAll.concat(beforeEach, main, afterEach, afterAll);

    // Limit this down to just user actions that have valid results.
    const filteredEvents: UserActionEvent[] = allEvents.filter((e): e is UserActionEvent => {
      const resultPoint = isUserActionTestEvent(e) ? e.data.timeStampedPoints.result : null;
      if (!resultPoint) {
        return false;
      }

      const isInFocusRange = isExecutionPointsWithinRange(resultPoint.point, begin, end);
      return isInFocusRange;
    });

    if (filteredEvents.length === 0) {
      return [];
    }

    const sources = await sourcesByIdCache.readAsync(replayClient);

    // We assume that _all_ events have the same `resultVariable` field. Per Ryan, this is a safe assumption.
    // The field may change across plugin versions, but all events in a recording will have the same value.
    // This _should_ generally be `"arguments[4]"` based on the current plugin.
    let processedResults: TestEventDetailsEntry[] = [];

    switch (testRunnerName) {
      case "cypress": {
        processedResults = await fetchCypressStepDetails(
          replayClient,
          filteredEvents,
          begin,
          end,
          sources
        );
        break;
      }
      case "playwright": {
        processedResults = await fetchPlaywrightStepDetails(
          replayClient,
          filteredEvents,
          begin,
          end,
          sources
        );
        break;
      }
      default:
        break;
    }

    for (const processedResult of processedResults) {
      // Store each result in the externally managed cache, to make it easy for the UI
      // to look up a single cache entry by point without needing all the other arguments.
      testEventDetailsResultsCache.cacheValue(processedResult, processedResult.point);
    }

    // Ensure that we have results for all requested events, even if we didn't receive
    // any data for them. Otherwise the details panel would get stuck in its loading
    // state for those events.
    for (const event of filteredEvents) {
      const eventPoint = event.data.timeStampedPoints.result;
      if (eventPoint && !testEventDetailsResultsCache.getValueIfCached(eventPoint.point)) {
        testEventDetailsResultsCache.cacheValue(
          {
            ...eventPoint,
            count: null,
            pauseId: null,
            props: null,
            testEvent: event,
          },
          eventPoint.point
        );
      }
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

async function fetchCypressStepDetails(
  replayClient: ReplayClientInterface,
  filteredEvents: RecordingTestMetadataV3.UserActionEvent[],
  begin: string,
  end: string,
  sources: Map<string, Source>
) {
  const stepDetailsVariable = filteredEvents[0].data.resultVariable;

  const variableNameWithConsoleProps = `${stepDetailsVariable}.consoleProps`;
  const testResultPoints = filteredEvents.map(e => e.data.timeStampedPoints.result!);

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

      const testEvent = filteredEvents.find(
        e => e.data.timeStampedPoints.result!.point === timeStampedPoint.point
      )!;

      const testEventDetailsEntry: TestEventDetailsEntry = {
        ...timeStampedPoint,
        pauseId: result.pauseId,
        testEvent,
        props: null,
        count: null,
      };

      if (!consolePropsValue?.object) {
        return testEventDetailsEntry;
      }

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

      // Sometimes the elements data is directly in this object,
      // other times it's nested under a `.props` field
      let propsObjectWithElements = sanitized;

      const propsObjectProp = findProtocolObjectProperty(sanitized, "props");

      if (propsObjectProp) {
        propsObjectWithElements = await objectCache.readAsync(
          replayClient,
          pauseId,
          propsObjectProp.object!,
          "full"
        );
      }

      // Kick this off, but don't block this cache read on it
      fetchAndCachePossibleCypressDomNode(
        replayClient,
        propsObjectWithElements,
        pauseId,
        timeStampedPoint,
        testEvent
      );

      const count =
        findProtocolObjectPropertyValue<number>(propsObjectWithElements, "Elements") ?? null;

      testEventDetailsEntry.count = count;
      testEventDetailsEntry.props = sanitized;

      return testEventDetailsEntry;
    })
  );
  return processedResults;
}

// Pre-fetch the DOM node for this step, if possible.
// Note this runs somewhat in the background and is not awaited,
// and mutates the `testEventDomNodeCache` with the results.
async function fetchAndCachePossibleCypressDomNode(
  replayClient: ReplayClientInterface,
  sanitized: ProtocolObject,
  pauseId: string,
  timeStampedPoint: TimeStampedPoint,
  testEvent: UserActionEvent
) {
  // Prefer "Yielded", because it's what the test step settled on
  // (such as a `eq` step selecting some element from a list)
  const propNamesWithPotentialElements = ["Yielded", "yielded", "Applied To"] as const;
  // Find the matching properties, in the same preference order
  const propsWithPotentialElements = propNamesWithPotentialElements.map(propName =>
    findProtocolObjectProperty(sanitized, propName)
  );

  // Grab the first prop field that points to some object (DOM node or array).
  // As an example, if there's `"Yielded": undefined`, we would skip that
  // and fall back to `"Applied To"` if that has something.
  const firstPropWithPotentialElements = propsWithPotentialElements.find(prop => prop?.object);

  let possibleDomNodes: ProtocolObject[] = [];

  if (firstPropWithPotentialElements?.object) {
    const cachedPropObject = await objectCache.readAsync(
      replayClient,
      pauseId,
      firstPropWithPotentialElements.object,
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
      possibleDomNodes = yieldedDomNodes;
    } else {
      possibleDomNodes = [cachedPropObject];
    }
  }

  await cacheDomNodeEntry(possibleDomNodes, replayClient, pauseId, timeStampedPoint, testEvent);
}

async function cacheDomNodeEntry(
  possibleDomNodes: ProtocolObject[],
  replayClient: ReplayClientInterface,
  pauseId: string,
  timeStampedPoint: TimeStampedPoint,
  testEvent: UserActionEvent
) {
  let elements: Element[] = [];

  if (possibleDomNodes.length > 0) {
    // Try to make sure this looks like a DOM node
    const matchingDomNodes = possibleDomNodes.filter(
      el => !!el && el.className !== "Object" && el.preview?.node
    );

    boundingRectsCache.prefetch(replayClient, pauseId);

    const initialElements = await Promise.all(
      matchingDomNodes.map(async domNode => {
        const cachedDomNode = await elementCache.readAsync(replayClient, pauseId, domNode.objectId);
        return cachedDomNode;
      })
    );

    const uniqueDomNodeIds = new Set<string>();

    // Only want to show elements that are actually in the page,
    // and remove any duplicates
    elements = initialElements.filter(e => {
      if (e.node.isConnected && !uniqueDomNodeIds.has(e.id)) {
        uniqueDomNodeIds.add(e.id);
        return true;
      }
      return false;
    });
  }

  const domNodeDetails: TestEventDomNodeDetails = {
    ...timeStampedPoint,
    pauseId,
    domNodes: elements,
    testEvent,
  };

  testEventDomNodeCache.cacheValue(domNodeDetails, domNodeDetails.point);
}

async function fetchPlaywrightStepDetails(
  replayClient: ReplayClientInterface,
  filteredEvents: RecordingTestMetadataV3.UserActionEvent[],
  begin: string,
  end: string,
  sources: Map<string, Source>
): Promise<TestEventDetailsEntry[]> {
  const evalResults: RunEvaluationResult[] = [];

  // This is the injected script that Playwright uses to parse selectors and query the DOM.
  const playwrightInjectedScriptModule: { source: string } = await import(
    "./assets/injectedScriptSource.js"
  );

  if (getPlaywrightTestStepDomNodesString === null) {
    await lazyImportExpression();
  }

  // These arguments and the preload eval string correspond to the Playwright setup logic
  // in `playwright-core/src/server/dom.ts::injectedScript()`.
  // We can hard-code several of these values ourselves.

  // Controls injection into window, and some other external pieces
  const isUnderTest = false;
  // Playwright can be used from multiple languages
  const sdkLanguage = "javascript";
  // data-testid can be customized by the user
  const testIdAttributeName = "data-testid";
  // WebKit on Windows needs 5, everything else is 1
  const rafCountForStablePosition = 1;
  const browserName = "chromium";
  const customSelectorEngines: string[] = [];

  const preloadExpression = `
        (() => {
          const module = {};
          ${playwrightInjectedScriptModule.source}
          return new (module.exports.InjectedScript())(
            globalThis,
            ${isUnderTest},
            "${sdkLanguage}",
            "${testIdAttributeName}",
            ${rafCountForStablePosition},
            "${browserName}",
            [${customSelectorEngines.join(",\n")}]
          );
        })();
      `;

  const pointsToLocatorStrings: Record<string, string> = {};
  for (const userEvent of filteredEvents) {
    // The locator string is always the first command arg.
    const locatorString = userEvent.data.command.arguments[0];
    const point = userEvent.data.timeStampedPoints.result!.point;
    pointsToLocatorStrings[point] = locatorString;
  }

  // Any focus range errors here will bubble up to the parent focus cache,
  // which will retry the load if needed later.
  await replayClient.runEvaluation(
    {
      selector: {
        kind: "points",
        points: Object.keys(pointsToLocatorStrings).sort(),
      },
      preloadExpressions: [
        {
          name: "PLAYWRIGHT_INJECTED_SCRIPT",
          expression: preloadExpression,
        },
      ],
      expression: `
        // Inject the lookup table of all locator strings
        const pointsToLocatorStrings = ${JSON.stringify(pointsToLocatorStrings)};

        const getPlaywrightTestStepDomNodes = ${getPlaywrightTestStepDomNodesString};

        const result = getPlaywrightTestStepDomNodes(pointsToLocatorStrings);

        result;
    `,
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
      const { pauseId, point: timeStampedPoint, returned, data } = result;
      const testEvent = filteredEvents.find(
        e => e.data.timeStampedPoints.result!.point === timeStampedPoint.point
      )!;

      const testEventDetailsEntry: TestEventDetailsEntry = {
        ...timeStampedPoint,
        pauseId: result.pauseId,
        testEvent,
        props: null,
        count: null,
      };

      if (!returned?.object) {
        return testEventDetailsEntry;
      }

      // This should already be cached because of `runEvaluation` returned nested previews.
      const resultValue = await objectCache.readAsync(
        replayClient,
        pauseId,
        returned.object,
        "full"
      );

      if (!resultValue.preview?.properties || resultValue.preview.properties.length === 0) {
        return testEventDetailsEntry;
      }

      const resultProps = resultValue.preview.properties;

      // Now we deconstruct the mixed array that was returned from the eval.

      // First is the number of target elements actually found.
      const numTargetElements = resultProps[0].value as number;

      let targetElements: ProtocolObject[] = [];

      if (numTargetElements > 0) {
        // Extract these DOM node object previews
        const targetElementProps = resultProps.slice(1, 1 + numTargetElements);
        targetElements = (
          await Promise.all(
            targetElementProps.map(async prop => {
              if (!prop.object) {
                return null;
              }
              const cachedPropObject = await objectCache.readAsync(
                replayClient,
                pauseId,
                prop.object,
                "canOverflow"
              );
              return cachedPropObject;
            })
          )
        ).filter(Boolean);

        const remainingProps = resultProps.slice(1 + numTargetElements);
        // The rest of the array is two stringified "parsed selector" sets,
        // and the `{ foundElements, allSelectedElements }` object.
        const [parsedSelectorStringProp, splitSelectorsStringProp, resultValueProp] =
          remainingProps;

        cacheDomNodeEntry(targetElements, replayClient, pauseId, timeStampedPoint, testEvent);

        const resultContents = await objectCache.readAsync(
          replayClient,
          pauseId,
          resultValueProp.object!,
          "canOverflow"
        );

        testEventDetailsEntry.props = resultContents;
        testEventDetailsEntry.count = numTargetElements;
      }

      return testEventDetailsEntry;
    })
  );

  return processedResults;
}

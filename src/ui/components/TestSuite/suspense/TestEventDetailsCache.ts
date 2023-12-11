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
import { compareExecutionPoints, isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import {
  RecordingTestMetadataV3,
  TestRecording,
  UserActionEvent,
  isUserActionTestEvent,
} from "shared/test-suites/RecordingTestMetadata";
import { boxModelCache } from "ui/suspense/nodeCaches";

export type TestEventDetailsEntry = TimeStampedPoint & {
  count: number | null;
  pauseId: PauseId;
  props: ProtocolObject | null;
};

export type TestEventDomNodeDetails = TimeStampedPoint & {
  pauseId: PauseId;
  domNode: Element | null;
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

    const { testRunnerName } = testRecording;

    // This should be the same ordering used by `<Panel>` to render the steps.
    const { beforeAll, beforeEach, main, afterEach, afterAll } = testRecording.events;
    const allEvents = beforeAll.concat(beforeEach, main, afterEach, afterAll);

    // Limit this down to just user actions that have valid results.
    const filteredEvents: UserActionEvent[] = allEvents.filter((e): e is UserActionEvent => {
      if (isUserActionTestEvent(e)) {
        // Same as TestStepDetails.tsx

        switch (testRunnerName) {
          case "cypress": {
            // Cypress commands have a `resultVariable` field that we need to find the
            // right step details object at the given `result` point.
            if (e.data.timeStampedPoints.result && e.data.resultVariable) {
              const isInFocusRange = isExecutionPointsWithinRange(
                e.data.timeStampedPoints.result.point,
                begin,
                end
              );
              return isInFocusRange;
            }
            return false;
          }
          case "playwright": {
            // Playwright commands have a "command" category. We'll only look for
            // steps that have a `locator.something()` command and a locator string arg.
            if (e.data.category === "command" && e.data.timeStampedPoints.beforeStep) {
              if (
                !e.data.command.name.startsWith("locator") ||
                e.data.command.arguments.length === 0 ||
                e.data.command.arguments[0].length === 0
              ) {
                return false;
              }
              const isInFocusRange = isExecutionPointsWithinRange(
                e.data.timeStampedPoints.beforeStep.point,
                begin,
                end
              );
              return isInFocusRange;
            }
            return false;
          }
          default:
            return false;
        }
      }
      return false;
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
        console.log("Attempted to process results for playwright: ", filteredEvents);
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
        fetchAndCachePossibleCypressDomNode(replayClient, sanitized, pauseId, timeStampedPoint);

        const elementsProp = sanitized.preview?.properties?.find(({ name }) => name === "Elements");
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
  return processedResults;
}

// Pre-fetch the DOM node for this step, if possible.
// Note this runs somewhat in the background and is not awaited,
// and mutates the `testEventDomNodeCache` with the results.
async function fetchAndCachePossibleCypressDomNode(
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

  await cacheDomNodeEntry(firstDomNode, replayClient, pauseId, timeStampedPoint);
}

async function cacheDomNodeEntry(
  firstDomNode: ProtocolObject | null | undefined,
  replayClient: ReplayClientInterface,
  pauseId: string,
  timeStampedPoint: TimeStampedPoint
) {
  let nodeInfo: Element | null = null;

  if (firstDomNode) {
    // Kick off a fetch for the box model now, so we have that cached when we try to highlight this node
    boxModelCache.prefetch(replayClient, pauseId, firstDomNode.objectId);
    nodeInfo = await elementCache.readAsync(replayClient, pauseId, firstDomNode.objectId);
  }

  const domNodeDetails: TestEventDomNodeDetails = {
    ...timeStampedPoint,
    pauseId,
    domNode: nodeInfo,
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
  const testResultPoints = filteredEvents.map(e => e.data.timeStampedPoints.beforeStep!);

  const evalResults: RunEvaluationResult[] = [];

  // This is the injected script that Playwright uses to parse selectors and query the DOM.
  const playwrightInjectedScriptModule: { source: string } = await import(
    "./assets/injectedScriptSource.js"
  );

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

  // Any focus range errors here will bubble up to the parent focus cache,
  // which will retry the load if needed later.
  await Promise.all(
    // TODO We don't currently have a way for `runEvaluation` expressions to have variable behavior
    // per execution point. The old analysis API put `point` and `time` in scope, and if we had
    // that we could do _one_ `runEvaluation` with a single expression that would contain a lookup
    // table mapping execution points to locator strings.
    // Since we don't have that, for now we'll run a separate `runEvaluation` _per point_. This is horrible
    // for perf, but it at least will work. (Slowly.)
    testResultPoints.map(async (p, index) => {
      const userEvent = filteredEvents[index];

      // The locator string is always the first command arg.
      const locatorString = userEvent.data.command.arguments[0];

      await replayClient.runEvaluation(
        {
          selector: {
            kind: "points",
            points: [p.point],
          },
          preloadExpressions: [
            {
              name: "PLAYWRIGHT_INJECTED_SCRIPT",
              expression: preloadExpression,
            },
          ],
          expression: `
          const locatorString = ${JSON.stringify(locatorString)};
          
          // Playwright parses the locator string into descriptive objects
          const parsedSelector = PLAYWRIGHT_INJECTED_SCRIPT.parseSelector(locatorString);

          let foundElements = []

          // Look for the actual target elements
          try {
            foundElements = PLAYWRIGHT_INJECTED_SCRIPT.querySelectorAll(parsedSelector, PLAYWRIGHT_INJECTED_SCRIPT.document) ?? [];
          } catch (err) { }

          // It may be useful for test debugging purposes to see _all_ of the elements retrieved
          // for _each_ segment of the locator string. Now that this is already split up,
          // we can do that by slicing the selector parts and querying for each subset.
          const iterativeSelectors = parsedSelector.parts.map((part, index) => {
            return {
              parts: parsedSelector.parts.slice(0, index + 1),
              capture: parsedSelector.capture
            }
          });

          const allSelectedElements = iterativeSelectors.map(selector => {
            let elements = []; 
            try {
              elements = PLAYWRIGHT_INJECTED_SCRIPT.querySelectorAll(selector, PLAYWRIGHT_INJECTED_SCRIPT.document);
            } catch (err) { }

            return elements;
          })


          // Now we deal with our runEvaluation object preview limits again.
          // To get the DOM node previews back as fast as possible, we'll inline the primary DOM
          // nodes directly into this result array.
          // We'll include the rest of the data for use in later dev work.
          const result = [
            foundElements.length,
            ...foundElements,
            JSON.stringify(parsedSelector),
            // all parsed selectors
            JSON.stringify(iterativeSelectors),
            {
              foundElements,
              allSelectedElements
            }
          ]

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
    })
  );

  evalResults.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

  // We need to reformat the raw analysis data to extract details on the "step details" object.
  const processedResults: TestEventDetailsEntry[] = await Promise.all(
    evalResults.map(async result => {
      const { pauseId, point: timeStampedPoint, returned, data } = result;
      if (!returned?.object) {
        return {
          ...timeStampedPoint,
          count: null,
          pauseId: result.pauseId,
          props: null,
        };
      }

      // This should already be cached because of `runEvaluation` returned nested previews.
      const resultValue = await objectCache.readAsync(
        replayClient,
        pauseId,
        returned.object,
        "full"
      );

      if (!resultValue.preview?.properties || resultValue.preview.properties.length === 0) {
        return {
          ...timeStampedPoint,
          count: null,
          pauseId: result.pauseId,
          props: null,
        };
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

        const [firstDomNode] = targetElements;

        cacheDomNodeEntry(firstDomNode, replayClient, pauseId, timeStampedPoint);

        return {
          ...timeStampedPoint,
          count: numTargetElements,
          pauseId,
          props: resultValueProp.value,
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

  return processedResults;
}

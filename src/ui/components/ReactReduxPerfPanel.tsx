import { sourceContentFor } from "@jridgewell/trace-mapping";
import { createSelector } from "@reduxjs/toolkit";
import {
  ExecutionPoint,
  FunctionMatch,
  FunctionOutline,
  Location,
  PauseDescription,
  PointDescription,
  PointStackFrame,
  RunEvaluationResult,
  SearchSourceContentsMatch,
  SourceLocation,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import classnames from "classnames";
import chunk from "lodash/chunk";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import zip from "lodash/zip";
import {
  CSSProperties,
  ReactNode,
  Suspense,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import {
  Cache,
  StreamingCache,
  createCache,
  createSingleEntryCache,
  createStreamingCache,
  useStreamingValue,
} from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import {
  PauseFrame,
  getExecutionPoint,
  getThreadContext,
} from "devtools/client/debugger/src/reducers/pause";
import { simplifyDisplayName } from "devtools/client/debugger/src/utils/pause/frames/displayName";
import { assert } from "protocol/utils";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import {
  pointsBoundingTimeCache,
  sessionEndPointCache,
} from "replay-next/src/suspense/ExecutionPointsCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { frameArgumentsCache } from "replay-next/src/suspense/FrameStepsCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { hitPointsCache } from "replay-next/src/suspense/HitPointsCache";
import { mappedExpressionCache } from "replay-next/src/suspense/MappedExpressionCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseIdCache, updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import { searchCache } from "replay-next/src/suspense/SearchCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { Source, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation as getPreferredLocationNext } from "replay-next/src/utils/sources";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsWithinRange,
} from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import {
  EventListenerWithFunctionInfo,
  FunctionWithPreview,
  IGNORABLE_PARTIAL_SOURCE_URLS,
  formatClassComponent,
  formatEventListener,
  locationToString,
} from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { getPreferredLocation } from "ui/reducers/sources";
import {
  SourceDetails,
  SourcesState,
  getSourceIdsByUrl,
  getSourceToDisplayForUrl,
} from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import {
  REDUX_ANNOTATIONS_KIND,
  annotationKindsCache,
  reduxDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";
import { getPauseFramesAsync } from "ui/suspense/frameCache";

import {
  getReactDomSourceUrl,
  jumpToTimeAndLocationForQueuedRender,
  reactInternalMethodsHitsCache,
  reactInternalMethodsHitsIntervalCache,
  reactRendersIntervalCache,
} from "./ReactPanel";
import MaterialIcon from "./shared/MaterialIcon";
import cardsListStyles from "ui/components/Comments/CommentCardsList.module.css";
import styles from "./Events/Event.module.css";

const MORE_IGNORABLE_PARTIAL_URLS = IGNORABLE_PARTIAL_SOURCE_URLS.concat(
  // Ignore _any_ 3rd-party package for now
  "node_modules"
);

interface ReactQueuedRenderDetails extends TimeStampedPoint {
  pauseFrames: PauseFrame[];
  filteredPauseFrames: PauseFrame[];
  userPauseFrame: PauseFrame;
}

interface PointWithLocation {
  location: Location;
  point?: TimeStampedPoint;
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

function doSomeAnalysis(range: TimeStampedPointRange | null): UIThunkAction {
  return async (dispatch, getState, { replayClient, protocolClient }) => {
    // await processAllSelectorCalls(getState, replayClient, range);
    const state = getState();
    const sourcesState = state.sources;
    const reactDomSourceUrl = getReactDomSourceUrl(state);
    const reactDomSource = getSourceToDisplayForUrl(state, reactDomSourceUrl!)!;

    const endpoint = await sessionEndPointCache.readAsync(replayClient);

    const fullRange = {
      begin: {
        time: 0,
        point: "0",
      },
      end: endpoint,
    };

    const finalRange: TimeStampedPointRange = range ?? fullRange;

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("react-redux")
    );

    // console.log("Fetching internals hits");

    reduxDispatchFunctionCache.evictAll();
    // const reduxDispatchStack = await reduxDispatchFunctionCache.readAsync(replayClient);

    const reduxDispatches = await reduxDispatchesCache.readAsync(
      BigInt(finalRange.begin.point),
      BigInt(finalRange.end.point),
      replayClient
    );

    console.log("Redux dispatches: ", reduxDispatches);

    const reactRenders = await reactRendersIntervalCache.readAsync(
      BigInt(finalRange.begin.point),
      BigInt(finalRange.end.point),
      replayClient
    );

    /*
    const reactInternalFunctionDetails = await reactInternalMethodsHitsCache.readAsync(
      replayClient,
      finalRange,
      reactDomSource,
      sourcesState
    );

    console.log("All React internal functions: ", reactInternalFunctionDetails);

    if (!reactInternalFunctionDetails) {
      return;
    }

    const {
      onCommitRoot,
      scheduleUpdateOnFiber,
      renderRootSync,
      renderWithHooks,
      finishClassComponent,
    } = reactInternalFunctionDetails;
    */

    /*
    const dispatchResults = await processReduxDispatches(
      getState,
      replayClient,
      finalRange,
      sourcesState,
      reactDomSource
    );

    const selectorResults = await processAllSelectorCalls(getState, replayClient, finalRange);

    const notificationResults = await processReduxNotifications(
      replayClient,
      finalRange,
      reactReduxSources,
      sourcesById,
      sourcesState
    );

    const allSelectorHitsFlattened = Object.values(selectorResults.allHitsPerSelector)
      .flat()
      .sort((a, b) => compareExecutionPoints(a.start.point, b.start.point));

    const dispatchesToProcess = dispatchResults; //.slice(0, 5);

      */

    // const processedDispatchResults = dispatchesToProcess.map(dispatchEntry => {
    //   const { afterReducer, afterNotifications } = dispatchEntry;

    //   const notificationsDuringDispatch = notificationResults.filter(n =>
    //     isExecutionPointsWithinRange(n.start.point, afterReducer.point, afterNotifications.point)
    //   );

    //   const selectorCallsDuringNotifications = allSelectorHitsFlattened.filter(n =>
    //     isExecutionPointsWithinRange(n.start.point, afterReducer.point, afterNotifications.point)
    //   );

    //   const sumOfSelectorDurations = selectorCallsDuringNotifications.reduce(
    //     (sum, n) => sum + n.duration,
    //     0
    //   );

    //   const selectorsWithExecutionGreaterThanZero = selectorCallsDuringNotifications.filter(
    //     n => n.duration > 0
    //   );

    //   /*
    //   const scheduledUpdatesDuringDispatch = scheduleUpdateOnFiber.hits.filter(n =>
    //     isExecutionPointsWithinRange(n.point, afterReducer.point, afterNotifications.point)
    //   );

    //   let functionComponentsRendered: TimeStampedPoint[] = [];
    //   let classComponentsRendered: TimeStampedPoint[] = [];

    //   const queuedRender = scheduledUpdatesDuringDispatch.length > 0;
    //   let nextRenderCommit: TimeStampedPoint | undefined;
    //   let nextRenderStart: TimeStampedPoint | undefined;
    //   if (queuedRender) {
    //     nextRenderStart = renderRootSync.hits.find(n =>
    //       isExecutionPointsGreaterThan(n.point, afterNotifications.point)
    //     );
    //     nextRenderCommit = onCommitRoot.hits.find(n =>
    //       isExecutionPointsGreaterThan(n.point, afterNotifications.point)
    //     );

    //     if (nextRenderStart && nextRenderCommit) {
    //       functionComponentsRendered = renderWithHooks.hits.filter(n =>
    //         isExecutionPointsWithinRange(n.point, nextRenderStart!.point, nextRenderCommit!.point)
    //       );

    //       classComponentsRendered = finishClassComponent.hits.filter(n =>
    //         isExecutionPointsWithinRange(n.point, nextRenderStart!.point, nextRenderCommit!.point)
    //       );
    //     }
    //   }
    //   */

    //   return {
    //     ...dispatchEntry,
    //     notificationsDuringDispatch,
    //     selectorCallsDuringNotifications,
    //     sumOfSelectorDurations,
    //     selectorsWithExecutionGreaterThanZero,
    //     // scheduledUpdatesDuringDispatch,
    //     // queuedRender,
    //     // nextRenderStart,
    //     // nextRenderCommit,
    //     // nextRenderDuration:
    //     //   nextRenderStart && nextRenderCommit
    //     //     ? nextRenderCommit.time - nextRenderStart.time
    //     //     : undefined,
    //     // functionComponentsRendered,
    //     // classComponentsRendered,
    //   };
    // });

    // console.log("Processed dispatch results: ", processedDispatchResults);

    /*
    const dispatchesWithQueuedRender = processedDispatchResults.filter(d => d.queuedRender);

    const lastDispatchWithRender =
      dispatchesWithQueuedRender[dispatchesWithQueuedRender.length - 1];
    if (!lastDispatchWithRender) {
      return;
    }

    const {
      nextRenderStart,
      nextRenderCommit,
      functionComponentsRendered,
      classComponentsRendered,
    } = lastDispatchWithRender;

    const actualFunctionComponentParamName = await getValidFunctionParameterName(
      replayClient,
      functionComponentsRendered[0],
      2,
      sourcesById
    );

    const results: RunEvaluationResult[] = [];

    console.log("Running function components evaluation...");

    const chunkedPoints = chunk(functionComponentsRendered, 190);
    await Promise.all(
      chunkedPoints.map(async points => {
        await replayClient.runEvaluation(
          {
            selector: {
              kind: "points",
              points: points.map(annotation => annotation.point),
            },
            expression: `${actualFunctionComponentParamName}`,
            // Run in top frame.
            frameIndex: 0,
            shareProcesses: true,
            fullPropertyPreview: true,
          },
          result => {
            results.push(...result);
          }
        );
      })
    );

    results.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

    console.log("Total results: ", results.length);

    console.log("Formatting functions...");

    const formattedFunctions = await Promise.all(
      results.map(async result => {
        const functionWithPreview = result.data.objects!.find(
          o => o.objectId === result.returned!.object!
        ) as FunctionWithPreview;
        const formattedFunction = (await formatEventListener(
          replayClient,
          "someType",
          functionWithPreview.preview,
          sourcesState
        ))!;
        return { formattedFunction, functionWithPreview };
      })
    );

    const uniqueComponentFunctions: Record<string, EventListenerWithFunctionInfo> = {};

    for (const entry of formattedFunctions) {
      const fnString = formattedFunctionToString(entry.formattedFunction);
      if (!uniqueComponentFunctions[fnString]) {
        uniqueComponentFunctions[fnString] = entry.formattedFunction;
      }
    }
    console.log("Formatted function components: ", uniqueComponentFunctions);

    if (classComponentsRendered.length > 0) {
      const actualClassComponentParamName = await getValidFunctionParameterName(
        replayClient,
        classComponentsRendered[0],
        1,
        sourcesById
      );

      const classComponentResults: RunEvaluationResult[] = [];

      console.log("Running class components evaluation...");

      const chunkedClassPoints = chunk(classComponentsRendered, 190);
      await Promise.all(
        chunkedClassPoints.map(async points => {
          await replayClient.runEvaluation(
            {
              selector: {
                kind: "points",
                points: points.map(annotation => annotation.point),
              },
              expression: `${actualClassComponentParamName}.stateNode._reactInternals.type`,
              // Run in top frame.
              frameIndex: 0,
              shareProcesses: true,
              fullPropertyPreview: true,
            },
            result => {
              classComponentResults.push(...result);
            }
          );
        })
      );

      classComponentResults.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

      console.log("Total results: ", classComponentResults.length);

      console.log("Formatting classes...");

      const formattedClasses = await Promise.all(
        classComponentResults.map(async result => {
          const functionWithPreview = result.data.objects!.find(
            o => o.objectId === result.returned!.object!
          ) as FunctionWithPreview;
          const formattedFunction = (await formatClassComponent(
            replayClient,
            "someType",
            functionWithPreview.preview,
            sourcesState
          ))!;
          return { formattedFunction, functionWithPreview };
        })
      );
      console.log("Finished formatting classes");

      const uniqueComponentClasses: Record<string, EventListenerWithFunctionInfo> = {};

      for (const entry of formattedClasses) {
        const fnString = formattedFunctionToString(entry.formattedFunction);
        if (!uniqueComponentClasses[fnString]) {
          uniqueComponentClasses[fnString] = entry.formattedFunction;
        }
      }
      console.log("Formatted classes: ", uniqueComponentClasses);
    }
    */
  };
}

async function processReduxNotifications(
  replayClient: ReplayClientInterface,
  range: TimeStampedPointRange,
  reactReduxSources: Source[],
  sourcesById: Map<string, Source>,
  sourcesState: SourcesState
) {
  const subscriberNotifyMatches: FunctionMatch[] = [];

  await replayClient.searchFunctions(
    { query: "notifyNestedSubs", sourceIds: reactReduxSources.map(source => source.id) },
    matches => {
      subscriberNotifyMatches.push(...matches);
    }
  );

  // console.log("Subscriber notify matches: ", subscriberNotifyMatches);
  const [firstMatch] = subscriberNotifyMatches;
  const preferredLocation = getPreferredLocation(sourcesState, [firstMatch.loc]);
  const source = sourcesById.get(preferredLocation.sourceId)!;
  const fileOutline = await sourceOutlineCache.readAsync(replayClient, source.id);
  const [breakablePositions, breakablePositionsByLine] = await breakpointPositionsCache.readAsync(
    replayClient,
    source.id
  );

  const subscriberNotifyFunction = findFunctionOutlineForLocation(firstMatch.loc, fileOutline)!;
  console.log("Subscriber notify function: ", subscriberNotifyFunction);
  //console.log("Subscriber breakable positions: ", breakablePositionsByLine);

  const notifyHits = await hitPointsCache.readAsync(
    BigInt(range.begin.point),
    BigInt(range.end.point),
    replayClient,
    { ...subscriberNotifyFunction.breakpointLocation!, sourceId: source.id },
    null
  );
  // console.log("Notify hits: ", notifyHits);

  const stepOutLocations = await Promise.all(
    notifyHits.map(hit => replayClient.findStepOutTarget(hit.point))
  );

  // console.log("Step out locations: ", stepOutLocations);

  const notifyStartFinishPairs = zip(notifyHits, stepOutLocations).map(([start, finish]) => {
    const preferredLocation = getPreferredLocation(sourcesState, finish!.frame!);
    return {
      start: start!,
      finish: finish!,
      source: sourcesById.get(preferredLocation.sourceId)!,
    };
  });

  console.log("Notify start/finish pairs: ", notifyStartFinishPairs);

  // const searchMatches: SearchSourceContentsMatch[] = [];
  // await replayClient.searchSources({ query: "notifyNestedSubs()" }, matches => {
  //   searchMatches.push(...matches);
  // });

  // console.log("Search matches: ", searchMatches);

  return notifyStartFinishPairs;
}

export interface FormattedPointStackFrame {
  url?: string;
  source: Source;
  functionLocation: Location;
  executionLocation: Location;
  point: PointDescription;
}

export function formatPointStackFrame(
  frame: PointStackFrame,
  sourcesById: Map<string, Source>
): FormattedPointStackFrame {
  updateMappedLocation(sourcesById, frame.functionLocation);
  updateMappedLocation(sourcesById, frame.point.frame ?? []);
  const functionLocation = getPreferredLocationNext(sourcesById, [], frame.functionLocation);
  const executionLocation = getPreferredLocationNext(sourcesById, [], frame.point.frame ?? []);

  const source = sourcesById.get(functionLocation.sourceId)!;

  return {
    url: source.url,
    source,
    functionLocation,
    executionLocation,
    point: frame.point,
  };
}

export async function formatPointStackForPoint(
  replayClient: ReplayClientInterface,
  point: TimeStampedPoint
) {
  const sourcesById = await sourcesByIdCache.readAsync(replayClient);
  const pointStack = await replayClient.getPointStack(point.point, 30);
  const formattedFrames = pointStack.map(frame => {
    return formatPointStackFrame(frame, sourcesById);
  });

  const filteredPauseFrames = formattedFrames.filter(frame => {
    const { source } = frame;
    // Filter out everything in `node_modules`, so we have just app code left
    // TODO There may be times when we care about renders queued by lib code
    // TODO See about just filtering out React instead?
    return !MORE_IGNORABLE_PARTIAL_URLS.some(partialUrl => source.url?.includes(partialUrl));
  });

  // We want the oldest app stack frame.
  // If this is a React update, that should be what called `setState()`
  // But, React also calls `scheduleUpdate` frequently _internally_.
  // So, there may not be any app code frames at all.
  let earliestAppCodeFrame: FormattedPointStackFrame | undefined = filteredPauseFrames.slice(-1)[0];

  let functionName;

  let resultPoint = point;
  if (earliestAppCodeFrame) {
    resultPoint = earliestAppCodeFrame.point;
    const formattedFunction = await formatEventListener(
      replayClient,
      "unknown",
      earliestAppCodeFrame.executionLocation
    );
    functionName = formattedFunction?.functionName;
  }

  return {
    point: resultPoint,
    functionName,
    frame: earliestAppCodeFrame!,
    allFrames: formattedFrames,
    filteredFrames: filteredPauseFrames,
  };
}

interface ReduxDispatchLocations {
  dispatch: FunctionOutline;
  reduxSource: Source;
  breakpoints: {
    dispatchStart: Location;
    beforeReducer: Location;
    reducerDone: Location;
    dispatchDone: Location;
  };
}

export const reduxDispatchFunctionCache: Cache<
  [replayClient: ReplayClientInterface, rangeStart: string, rangeEnd: string],
  ReduxDispatchLocations | undefined
> = createCache({
  debugLabel: "ReduxDispatchFunction",
  async load([replayClient, rangeStart, rangeEnd]) {
    // TODO This relies on having a reasonably sourcemapped version of Redux.
    // This won't work otherwise.
    // There's some stupid tricks we could pull to find this in minified sources,
    // like looking for the `ActionTypes.REPLACE` variable
    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("/redux/")
    );

    const dispatchMatches: FunctionMatch[] = [];
    await replayClient.searchFunctions(
      { query: "dispatch", sourceIds: reactReduxSources.map(source => source.id) },
      matches => {
        dispatchMatches.push(...matches);
      }
    );

    const [firstMatch] = dispatchMatches;

    const preferredLocation = getPreferredLocationNext(sourcesById, [], [firstMatch.loc]);
    const reduxSource = sourcesById.get(preferredLocation.sourceId)!;
    const fileOutline = await sourceOutlineCache.readAsync(replayClient, reduxSource.id);

    const dispatchFunctions = fileOutline.functions.filter(o => o.name === "dispatch");
    const createStoreFunction = fileOutline.functions.find(o => o.name === "createStore")!;
    const realDispatchFunction = dispatchFunctions.find(f => {
      return (
        f.location.begin.line >= createStoreFunction.location.begin.line &&
        f.location.end.line < createStoreFunction.location.end.line
      );
    })!;

    if (!realDispatchFunction) {
      return;
    }

    const [breakablePositions, breakablePositionsByLine] = await breakpointPositionsCache.readAsync(
      replayClient,
      reduxSource.id
    );

    const streaming = streamingSourceContentsCache.stream(replayClient, reduxSource!.id);
    await streaming.resolver;
    const reduxSourceLines = streaming.value!.split("\n");
    const beforeReducerLine =
      reduxSourceLines.findIndex(line => line.includes("isDispatching = true")) + 1;
    const reducerDoneLine =
      reduxSourceLines.findIndex(line => line.includes("currentListeners = nextListeners")) + 1;
    const dispatchDoneLine = reduxSourceLines.findIndex(line => line.includes("return action")) + 1;
    console.log({ reducerDoneLine, dispatchDoneLine });

    const [beforeReducer, reducerDone, dispatchDone]: Location[] = [
      beforeReducerLine,
      reducerDoneLine,
      dispatchDoneLine,
    ].map(line => {
      return {
        sourceId: reduxSource.id,
        line,
        column: breakablePositionsByLine.get(line)!.columns[0],
      };
    });

    const dispatchStart: Location = {
      ...realDispatchFunction.breakpointLocation!,
      sourceId: reduxSource.id,
    };

    return {
      dispatch: realDispatchFunction,
      reduxSource,
      breakpoints: {
        dispatchStart,
        beforeReducer,
        reducerDone,
        dispatchDone,
      },
    };
  },
});

interface ReduxDispatchDetailsEntry {
  actionType: string;
  dispatchStart: PointDescription;
  beforeReducer: PointDescription;
  afterReducer: PointDescription;
  afterNotifications: PointDescription;
  reducerDuration: number;
  notificationDuration: number;
}

export const reduxDispatchesCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface],
  ReduxDispatchDetailsEntry
>({
  debugLabel: "RecordedProtocolMessages",
  getPointForValue: data => data.dispatchStart.point,
  async load(rangeStart, rangeEnd, replayClient) {
    const dispatchFunctionDetails = await reduxDispatchFunctionCache.readAsync(
      replayClient,
      rangeStart,
      rangeEnd
    );

    if (!dispatchFunctionDetails) {
      return [];
    }

    const { dispatch, reduxSource, breakpoints } = dispatchFunctionDetails;

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const dispatchLocations = [
      { ...dispatch.breakpointLocation!, sourceId: reduxSource.id },
      breakpoints.beforeReducer,
      breakpoints.reducerDone,
      breakpoints.dispatchDone,
    ];

    const [reduxDispatchHits, beforeReducerHits, reducerDoneHits, dispatchDoneHits] =
      await Promise.all(
        dispatchLocations.map(location => {
          return hitPointsCache.readAsync(
            BigInt(rangeStart),
            BigInt(rangeEnd),
            replayClient,
            location,
            null
          );
        })
      );

    if (!reduxDispatchHits.length) {
      return [];
    }

    const [firstHit] = reduxDispatchHits;
    const frames = firstHit.frame ?? [];

    const possibleParamNames = await Promise.all(
      frames.map(async frame => {
        const sourceOutline = await sourceOutlineCache.readAsync(replayClient, frame.sourceId);
        const functionOutline = findFunctionOutlineForLocation(frame, sourceOutline);
        return functionOutline?.parameters[0];
      })
    );
    console.log("Possible param names: ", possibleParamNames);

    const paramName = possibleParamNames.find(name => name !== "action") ?? "action";

    const results: RunEvaluationResult[] = [];

    const chunkedReduxDispatchHits = chunk(reduxDispatchHits, 190);
    await Promise.all(
      chunkedReduxDispatchHits.map(async points => {
        await replayClient.runEvaluation(
          {
            selector: {
              kind: "points",
              points: points.map(annotation => annotation.point),
            },
            expression: `${paramName}.type`,
            // Run in top frame.
            frameIndex: 0,
            shareProcesses: true,
            fullPropertyPreview: true,
          },
          result => {
            results.push(...result);
          }
        );
      })
    );

    const actionTypes: string[] = results.map(result => {
      return result.returned!.value;
    });

    console.log("Fetching point stacks...");
    const pointStacks = await Promise.all(
      reduxDispatchHits.map(hit => {
        return replayClient.getPointStack(hit.point, 5);
      })
    );
    console.log("Point stacks: ", pointStacks);

    const maxItems = Math.min(
      reduxDispatchHits.length,
      beforeReducerHits.length,
      reducerDoneHits.length,
      dispatchDoneHits.length,
      actionTypes.length
    );

    const dispatchDetails = zip(
      reduxDispatchHits.slice(0, maxItems),
      beforeReducerHits.slice(0, maxItems),
      reducerDoneHits.slice(0, maxItems),
      dispatchDoneHits.slice(0, maxItems),
      actionTypes.slice(0, maxItems)
    ).map(([dispatchStart, beforeReducer, afterReducer, afterNotifications, actionType]) => {
      const beforeReducerTime = beforeReducer?.time ?? 0;
      const afterReducerTime: number = afterReducer?.time ?? 0;
      const afterNotificationsTime = afterNotifications?.time ?? 0;
      return {
        actionType: actionType!,
        dispatchStart: dispatchStart!,
        beforeReducer: beforeReducer!,
        afterReducer: afterReducer!,
        afterNotifications: afterNotifications!,
        reducerDuration: afterReducerTime - beforeReducerTime,
        notificationDuration: afterNotificationsTime - afterReducerTime,
      };
    });

    return dispatchDetails;
  },
});

async function processReduxDispatches(
  getState: () => UIState,
  replayClient: ReplayClientInterface,
  range: TimeStampedPointRange,
  sourcesState: SourcesState,
  reactDomSource: Source
) {
  console.log("Searching functions for `dispatch`...");

  const dispatchFunctionDetails = await reduxDispatchFunctionCache.readAsync(
    replayClient,
    range.begin.point,
    range.end.point
  );

  if (!dispatchFunctionDetails) {
    return;
  }

  const { dispatch, reduxSource, breakpoints } = dispatchFunctionDetails;

  const sourcesById = await sourcesByIdCache.readAsync(replayClient);

  // console.log({ createStoreFunction, realDispatchFunction });

  const dispatchLocations = [
    dispatch.breakpointLocation!,
    breakpoints.beforeReducer,
    breakpoints.reducerDone,
    breakpoints.dispatchDone,
  ];

  const [reduxDispatchHits, beforeReducerHits, reducerDoneHits, dispatchDoneHits] =
    await Promise.all(
      dispatchLocations.map(location => {
        return hitPointsCache.readAsync(
          BigInt(range.begin.point),
          BigInt(range.end.point),
          replayClient,
          { ...location, sourceId: reduxSource.id },
          null
        );
      })
    );

  // const reduxDispatchHits = await hitPointsCache.readAsync(
  //   BigInt(range.begin.point),
  //   BigInt(range.end.point),
  //   replayClient,
  //   { ...realDispatchFunction.breakpointLocation!, sourceId: reduxSource.id },
  //   null
  // );

  const firstParam = await getValidFunctionParameterName(
    replayClient,
    reduxDispatchHits[0],
    0,
    sourcesById
  );

  console.log("Actual `action` variable: ", firstParam);

  /*
  // console.log("Redux dispatch hits: ", reduxDispatchHits);
  const likelyDispatchRenderCommits = reduxDispatchHits.map(dispatchHit => {
    const nextRenderHit = timePoints.onCommitFiberHitPoints.find(commitHit =>
      isExecutionPointsGreaterThan(commitHit.point, dispatchHit.point)
    );
    return {
      dispatchHit,
      nextRenderHit,
    };
  });

  console.log("Likely dispatch render commits: ", likelyDispatchRenderCommits);
  */

  const results: RunEvaluationResult[] = [];

  const chunkedReduxDispatchHits = chunk(reduxDispatchHits, 190);
  await Promise.all(
    chunkedReduxDispatchHits.map(async points => {
      await replayClient.runEvaluation(
        {
          selector: {
            kind: "points",
            points: points.map(annotation => annotation.point),
          },
          expression: `${firstParam}`,
          // Run in top frame.
          frameIndex: 0,
          shareProcesses: true,
          fullPropertyPreview: true,
        },
        result => {
          results.push(...result);
        }
      );
    })
  );

  const actionObjects = results.map(result => {
    const actionObject = result.data.objects!.find(o => o.objectId === result.returned!.object!);
    return actionObject?.preview?.properties;
  });

  const maxItems = Math.min(
    reduxDispatchHits.length,
    beforeReducerHits.length,
    reducerDoneHits.length,
    dispatchDoneHits.length,
    actionObjects.length
  );

  const dispatchDetails = zip(
    reduxDispatchHits.slice(0, maxItems),
    beforeReducerHits.slice(0, maxItems),
    reducerDoneHits.slice(0, maxItems),
    dispatchDoneHits.slice(0, maxItems),
    actionObjects.slice(0, maxItems)
  ).map(
    ([dispatchStart, beforeReducer, afterReducer, afterNotifications, actionObjectProperties]) => {
      const actionType: string = actionObjectProperties!.find(p => p.name === "type")?.value;
      const beforeReducerTime = beforeReducer?.time ?? 0;
      const afterReducerTime: number = afterReducer?.time ?? 0;
      const afterNotificationsTime = afterNotifications?.time ?? 0;
      return {
        actionType: actionType!,
        dispatchStart: dispatchStart!,
        beforeReducer: beforeReducer!,
        afterReducer: afterReducer!,
        afterNotifications: afterNotifications!,
        reducerDuration: afterReducerTime - beforeReducerTime,
        notificationDuration: afterNotificationsTime - afterReducerTime,
      };
    }
  );

  console.log("Dispatch details: ", dispatchDetails);
  return dispatchDetails;
}

async function processAllSelectorCalls(
  getState: () => UIState,
  replayClient: ReplayClientInterface,
  range: TimeStampedPointRange | null
) {
  const sourcesState = getState().sources;

  console.log("Searching functions...");

  const sourcesById = await sourcesByIdCache.readAsync(replayClient);
  const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
    source.url?.includes("react-redux")
  );

  const useSelectorMatches: FunctionMatch[] = [];

  await replayClient.searchFunctions(
    { query: "useSelector", sourceIds: reactReduxSources.map(source => source.id) },
    matches => {
      useSelectorMatches.push(...matches);
    }
  );
  const [firstMatch] = useSelectorMatches;
  const preferredLocation = getPreferredLocation(sourcesState, [firstMatch.loc]);
  const source = sourcesById.get(preferredLocation.sourceId)!;
  const fileOutline = await sourceOutlineCache.readAsync(replayClient, source.id);
  const [breakablePositions, breakablePositionsByLine] = await breakpointPositionsCache.readAsync(
    replayClient,
    source.id
  );

  const useSelectorOutline = findFunctionOutlineForLocation(firstMatch.loc, fileOutline)!;

  const endpoint = await sessionEndPointCache.readAsync(replayClient);

  const finalRange: TimeStampedPointRange = range ?? {
    begin: {
      time: 0,
      point: "0",
    },
    end: endpoint,
  };

  const lastLine = useSelectorOutline.location.end.line - 1;
  const lastLineBreakablePositions = breakablePositionsByLine.get(lastLine)!;
  const lastLineBreakpoint: Location = {
    sourceId: source.id,
    line: lastLine,
    column: lastLineBreakablePositions.columns[0],
  };

  const firstLineHitPoints = await hitPointsCache.readAsync(
    BigInt(finalRange.begin.point),
    BigInt(finalRange.end.point),
    replayClient,
    { ...useSelectorOutline.breakpointLocation!, sourceId: source.id },
    null
  );

  const lastLineHitPoints = await hitPointsCache.readAsync(
    BigInt(finalRange.begin.point),
    BigInt(finalRange.end.point),
    replayClient,
    lastLineBreakpoint,
    null
  );

  console.log("`useSelector` hits: ", firstLineHitPoints.length);

  const NUM_POINTS_TO_ANALYZE = Math.min(firstLineHitPoints.length, 200);

  const firstTestPoint = firstLineHitPoints[0];

  /*
  const slicedFirstPoints = firstLineHitPoints.slice(0, NUM_POINTS_TO_ANALYZE);
  const slicedLastPoints = lastLineHitPoints.slice(0, NUM_POINTS_TO_ANALYZE);

  const times: number[] = [];

  for (let i = 0; i < NUM_POINTS_TO_ANALYZE; i++) {
    const firstTime = slicedFirstPoints[i].time;
    const lastTime = slicedLastPoints[i].time;
    const totalTime = lastTime - firstTime;
    times.push(totalTime);
  }
  */

  console.log("Running test evaluation...");
  const firstParam = await getValidFunctionParameterName(
    replayClient,
    firstTestPoint,
    0,
    sourcesById
  );

  const results: RunEvaluationResult[] = [];

  console.log("Running selectors evaluation...");

  const chunkedFirstPoints = chunk(firstLineHitPoints, 190);
  console.log("Chunked points: ", chunkedFirstPoints);
  await Promise.all(
    chunkedFirstPoints.map(async points => {
      await replayClient.runEvaluation(
        {
          selector: {
            kind: "points",
            points: points.map(annotation => annotation.point),
          },
          expression: `${firstParam}`,
          // Run in top frame.
          frameIndex: 0,
          shareProcesses: true,
          fullPropertyPreview: true,
        },
        result => {
          results.push(...result);
        }
      );
    })
  );

  results.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

  console.log("Total results: ", results.length);

  console.log("Formatting functions...");

  const formattedFunctions = await Promise.all(
    results.map(result => {
      return formatFunctionEvaluationResult(replayClient, result);
    })
  );

  const uniqueSelectorFunctions: Record<string, EventListenerWithFunctionInfo> = {};

  for (const entry of formattedFunctions) {
    const fnString = formattedFunctionToString(entry.formattedFunction);
    if (!uniqueSelectorFunctions[fnString]) {
      uniqueSelectorFunctions[fnString] = entry.formattedFunction;
    }
  }
  console.log("Formatted functions: ", uniqueSelectorFunctions);

  interface SelectorCallDetails {
    start: TimeStampedPoint;
    end: TimeStampedPoint;
    duration: number;
    function: EventListenerWithFunctionInfo;
  }

  console.log("Summarizing hit details...");
  const selectorCallDetails: SelectorCallDetails[] = [];

  assert(
    firstLineHitPoints.length === formattedFunctions.length,
    "Should have one function per hit"
  );

  for (let i = 0; i < firstLineHitPoints.length; i++) {
    const start = firstLineHitPoints[i];
    const end = lastLineHitPoints[i];
    const duration = end.time - start.time;
    const functionInfo = formattedFunctions[i];
    selectorCallDetails.push({
      start,
      end,
      duration,
      function: functionInfo.formattedFunction,
    });
  }

  interface FunctionExecutionTime {
    locationString: string;
    start: TimeStampedPoint;
    end: TimeStampedPoint;
    duration: number;
    frame: PauseDescription["frame"];
    exitLocation: Source;
  }

  const allHitsPerSelector: Record<string, FunctionExecutionTime[]> = {};

  console.log("Fetching all selector function hits", finalRange);
  await Promise.all(
    Object.values(uniqueSelectorFunctions).map(async fn => {
      const locationString = formattedFunctionToString(fn);

      const hits = await hitPointsCache.readAsync(
        BigInt(finalRange.begin.point),
        BigInt(finalRange.end.point),
        replayClient,
        fn.firstBreakablePosition,
        null
      );
      const selectorCallEndTimes = await Promise.all(
        hits.map(async hit => {
          return replayClient.findStepOutTarget(hit.point);
        })
      );
      const functionExecutions: FunctionExecutionTime[] = [];
      for (let i = 0; i < hits.length; i++) {
        const end = selectorCallEndTimes[i];

        const endPreferredLocation = getPreferredLocation(sourcesState, end.frame!);
        const endSource = sourcesById.get(endPreferredLocation.sourceId)!;

        functionExecutions.push({
          locationString,
          start: hits[i],
          end,
          frame: end.frame,
          duration: end.time - hits[i].time,
          exitLocation: endSource,
        });
      }
      allHitsPerSelector[locationString] = functionExecutions;
    })
  );

  console.log("All selector function hits: ", allHitsPerSelector);

  const groupedCalls = groupBy(selectorCallDetails, call =>
    formattedFunctionToString(call.function)
  );

  const sumsPerSelector = mapValues(allHitsPerSelector, (calls, locationString) => {
    const numCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
    return {
      locationString,
      calls: numCalls,
      totalDuration,
      average: numCalls > 0 ? totalDuration / numCalls : 0,
    };
  });

  console.log(groupedCalls);
  console.log(sumsPerSelector);

  const sortedSumsPerSelector = Object.values(sumsPerSelector).sort(
    (a, b) => b.totalDuration - a.totalDuration
  );
  console.log("Sorted sums: ", sortedSumsPerSelector);

  return {
    allHitsPerSelector,
    sumsPerSelector,
    sortedSumsPerSelector,
  };
}

async function formatFunctionEvaluationResult(
  replayClient: ReplayClientInterface,
  result: RunEvaluationResult
) {
  const functionWithPreview = result.data.objects!.find(
    o => o.objectId === result.returned!.object!
  ) as FunctionWithPreview;
  const formattedFunction = (await formatEventListener(
    replayClient,
    "someType",
    functionWithPreview.preview.functionLocation
  ))!;
  return { formattedFunction, functionWithPreview };
}

function formattedFunctionToString(fn: EventListenerWithFunctionInfo) {
  return `${locationToString(fn.location)}:${fn.functionName}`;
}

async function getValidFunctionParameterName(
  replayClient: ReplayClientInterface,
  firstTestPoint: TimeStampedPoint,
  paramIndex: number,
  sourcesById: Map<string, Source>
) {
  const testResults: RunEvaluationResult[] = [];
  await replayClient.runEvaluation(
    {
      selector: {
        kind: "points",
        points: [firstTestPoint.point],
      },
      expression: `doesNotExist`,
      // Run in top frame.
      frameIndex: 0,
      shareProcesses: true,
    },
    result => {
      testResults.push(...result);
    }
  );

  console.log("Fetching parameter source details");
  const frames = testResults[0].point.frame ?? [];

  const firstFrame = frames[0];
  const frameSource = sourcesById.get(firstFrame.sourceId)!;
  const sourceOutline = await sourceOutlineCache.readAsync(replayClient, frameSource.id);
  const functionOutline = findFunctionOutlineForLocation(firstFrame, sourceOutline)!;
  const firstParam = functionOutline.parameters[paramIndex];
  return firstParam;
}

interface ReduxDispatchItemData {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
  entries: ReduxDispatchDetailsEntry[];
}

function ReduxDispatchListItem({
  data,
  index,
  style,
}: {
  data: ReduxDispatchItemData;
  index: number;
  style: CSSProperties;
}) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const dispatchDetails = data.entries[index];
  const { executionPoint, onSeek, currentTime } = data;
  const { actionType, dispatchStart } = dispatchDetails;
  // const { point, frame, functionName } = renderDetails;
  const isPaused = dispatchStart.time === currentTime && executionPoint === dispatchStart.point;
  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const onMouseEnter = () => {};

  const onMouseLeave = () => {};

  const onClickJumpToCode = async () => {
    const formattedPointStack = await formatPointStackForPoint(replayClient, dispatchStart);

    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        dispatchStart,
        formattedPointStack?.frame?.executionLocation,
        "timeAndLocation",
        onSeek
      )
    );
  };

  return (
    <div style={style}>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < dispatchStart.time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <AccessibleImage className="redux" />
          <Label>{actionType}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={dispatchStart.point}
            />
          }
        </div>
      </div>
    </div>
  );
}

function ReactReduxPerfPanelSuspends() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { range: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);

  const handleDoAnalysisClick = async () => {
    dispatch(doSomeAnalysis(focusRange));
  };

  const reduxDispatchEntries = reduxDispatchesCache.read(
    BigInt(focusRange!.begin.point),
    BigInt(focusRange!.end.point),
    replayClient
  );

  const itemData: ReduxDispatchItemData = useMemo(() => {
    const onSeek = (executionPoint: string, time: number) => {
      dispatch(seek({ executionPoint, time }));
    };

    return {
      executionPoint: executionPoint!,
      currentTime,
      entries: reduxDispatchEntries,
      onSeek,
    };
  }, [reduxDispatchEntries, dispatch, currentTime, executionPoint]);

  // return (
  //   <div className={styles.Sidebar}>
  //     <div className={styles.Toolbar}>
  //       <div className={styles.ToolbarHeader}>React+Redux Perf</div>
  //       <button className="row logout" onClick={handleDoAnalysisClick}>
  //         <span className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  //           Do Something
  //         </span>
  //       </button>
  //     </div>
  //     <div className={styles.List}>{

  //     }</div>
  //   </div>
  // );
  return (
    <div style={{ flex: "1 1 auto", height: "100%" }}>
      <AutoSizer disableWidth>
        {({ height }: { height: number }) => {
          return (
            <List
              children={ReduxDispatchListItem}
              height={height}
              itemCount={itemData.entries.length}
              itemData={itemData}
              itemSize={30}
              width="100%"
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}

export function ReactReduxPerfPanel() {
  const { range: focusRange } = useContext(FocusContext);
  const allSourcesReceived = useAppSelector(state => state.sources.allSourcesReceived);
  if (!focusRange?.begin) {
    return <div>No focus range</div>;
  } else if (!allSourcesReceived) {
    return <div>Loading sources...</div>;
  }

  return (
    <div className={cardsListStyles.Sidebar}>
      <div className={cardsListStyles.Toolbar}>
        <div className={cardsListStyles.ToolbarHeader}>Redux Dispatch Perf</div>
      </div>
      <Suspense
        fallback={
          <div style={{ flexShrink: 1 }}>
            <IndeterminateLoader />
          </div>
        }
      >
        <ReactReduxPerfPanelSuspends />
      </Suspense>
    </div>
  );
}

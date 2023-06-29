import { sourceContentFor } from "@jridgewell/trace-mapping";
import { createSelector } from "@reduxjs/toolkit";
import {
  ExecutionPoint,
  FunctionMatch,
  FunctionOutline,
  Location,
  PauseDescription,
  PointDescription,
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
import { ReactNode, useContext, useState } from "react";
import {
  Cache,
  StreamingCache,
  createCache,
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
import { frameArgumentsCache } from "replay-next/src/suspense/FrameStepsCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import {
  getHitPointsForLocationAsync,
  hitPointsCache,
} from "replay-next/src/suspense/HitPointsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { searchCache } from "replay-next/src/suspense/SearchCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { Source, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { compareExecutionPoints, isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import {
  EventListenerWithFunctionInfo,
  FunctionWithPreview,
  IGNORABLE_PARTIAL_SOURCE_URLS,
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
import { getPauseFramesAsync } from "ui/suspense/frameCache";

import { getReactDomSourceUrl, reactInternalMethodsHitsCache } from "./ReactPanel";
import MaterialIcon from "./shared/MaterialIcon";
import styles from "ui/components/Comments/CommentCardsList.module.css";

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

    const finalRange: TimeStampedPointRange = range ?? {
      begin: {
        time: 0,
        point: "0",
      },
      end: endpoint,
    };

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("react-redux")
    );

    await processReduxDispatches(getState, replayClient, finalRange, sourcesState, reactDomSource);

    await processAllSelectorCalls(getState, replayClient, finalRange);

    await processReduxNotifications(
      replayClient,
      finalRange,
      reactReduxSources,
      sourcesById,
      sourcesState
    );
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
      start,
      finish,
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

async function processReduxDispatches(
  getState: () => UIState,
  replayClient: ReplayClientInterface,
  range: TimeStampedPointRange,
  sourcesState: SourcesState,
  reactDomSource: Source
) {
  console.log("Fetching internals hits");
  const timePoints = await reactInternalMethodsHitsCache.readAsync(
    replayClient,
    range,
    reactDomSource,
    sourcesState
  );
  if (!timePoints) {
    return [];
  }

  console.log("React internals time points: ", timePoints);

  const dispatchMatches: FunctionMatch[] = [];

  console.log("Searching functions for `dispatch`...");

  const sourcesById = await sourcesByIdCache.readAsync(replayClient);
  const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
    source.url?.includes("/redux/")
  );

  await replayClient.searchFunctions(
    { query: "dispatch", sourceIds: reactReduxSources.map(source => source.id) },
    matches => {
      dispatchMatches.push(...matches);
    }
  );

  const [firstMatch] = dispatchMatches;
  const preferredLocation = getPreferredLocation(sourcesState, [firstMatch.loc]);
  const reduxSource = sourcesById.get(preferredLocation.sourceId)!;
  const fileOutline = await sourceOutlineCache.readAsync(replayClient, reduxSource.id);
  const streaming = streamingSourceContentsCache.stream(replayClient, reduxSource!.id);
  await streaming.resolver;

  const dispatchFunctions = fileOutline.functions.filter(o => o.name === "dispatch");
  const createStoreFunction = fileOutline.functions.find(o => o.name === "createStore")!;
  const realDispatchFunction = dispatchFunctions.find(f => {
    return (
      f.location.begin.line >= createStoreFunction.location.begin.line &&
      f.location.end.line < createStoreFunction.location.end.line
    );
  })!;
  console.log({ createStoreFunction, realDispatchFunction });

  const [breakablePositions, breakablePositionsByLine] = await breakpointPositionsCache.readAsync(
    replayClient,
    reduxSource.id
  );

  const reduxSourceLines = streaming.value!.split("\n");
  const beforeDispatchLine =
    reduxSourceLines.findIndex(line => line.includes("isDispatching = true")) + 1;
  const reducerDoneLine =
    reduxSourceLines.findIndex(line => line.includes("currentListeners = nextListeners")) + 1;
  const dispatchDoneLine = reduxSourceLines.findIndex(line => line.includes("return action")) + 1;
  console.log({ reducerDoneLine, dispatchDoneLine });

  const beforeReducerBreakpoint: SourceLocation = {
    line: beforeDispatchLine,
    column: breakablePositionsByLine.get(beforeDispatchLine)!.columns[0],
  };

  const reducerDoneBreakpoint: SourceLocation = {
    line: reducerDoneLine,
    column: breakablePositionsByLine.get(reducerDoneLine)!.columns[0],
  };

  const dispatchDoneBreakpoint: SourceLocation = {
    line: dispatchDoneLine,
    column: breakablePositionsByLine.get(dispatchDoneLine)!.columns[0],
  };

  const dispatchLocations = [
    realDispatchFunction.breakpointLocation!,
    beforeReducerBreakpoint,
    reducerDoneBreakpoint,
    dispatchDoneBreakpoint,
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

  // console.log("Actual `action` variable: ", firstParam);

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

  const dispatchDetails = zip(
    reduxDispatchHits,
    beforeReducerHits,
    reducerDoneHits,
    dispatchDoneHits,
    actionObjects
  ).map(
    ([dispatchStart, beforeReducer, afterReducer, afterNotifications, actionObjectProperties]) => {
      const actionType: string = actionObjectProperties!.find(p => p.name === "type")?.value;
      return {
        actionType: actionType!,
        dispatchStart: dispatchStart!,
        beforeReducer: beforeReducer!,
        afterReducer: afterReducer!,
        afterNotifications: afterNotifications!,
        reducerDuration: afterReducer!.time - beforeReducer!.time,
        notificationDuration: afterNotifications!.time - afterReducer!.time,
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
          start: hits[i],
          end,
          frame: end.frame,
          duration: end.time - hits[i].time,
          exitLocation: endSource,
        });
      }
      allHitsPerSelector[formattedFunctionToString(fn)] = functionExecutions;
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

export function ReactReduxPerfPanel() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const replayClient = useContext(ReplayClientContext);
  const { rangeForDisplay: focusRange } = useContext(FocusContext);

  const handleDoAnalysisClick = async () => {
    dispatch(doSomeAnalysis(focusRange));
  };

  return (
    <div className={styles.Sidebar}>
      <div className={styles.Toolbar}>
        <div className={styles.ToolbarHeader}>React+Redux Perf</div>
        <button className="row logout" onClick={handleDoAnalysisClick}>
          <span className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Do Something
          </span>
        </button>
      </div>
      <div className={styles.List}>{}</div>
    </div>
  );
}

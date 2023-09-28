import {
  FunctionMatch,
  FunctionOutline,
  Location,
  PointDescription,
  RunEvaluationResult,
} from "@replayio/protocol";
import chunk from "lodash/chunk";
import zip from "lodash/zip";
import { Cache, createCache } from "suspense";

import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { hitPointsCache } from "replay-next/src/suspense/HitPointsCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { Source, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation as getPreferredLocationNext } from "replay-next/src/utils/sources";
import { ReplayClientInterface } from "shared/client/types";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";

export interface ReduxDispatchLocations {
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
    const reduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("/redux/")
    );

    const dispatchMatches: FunctionMatch[] = [];
    await replayClient.searchFunctions(
      { query: "dispatch", sourceIds: reduxSources.map(source => source.id) },
      matches => {
        dispatchMatches.push(...matches);
      }
    );

    const [firstMatch] = dispatchMatches;
    if (!firstMatch) {
      return;
    }

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

export interface ReduxDispatchDetailsEntry {
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

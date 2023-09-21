import { createSelector } from "@reduxjs/toolkit";
import {
  ExecutionPoint,
  FunctionOutline,
  Location,
  PointDescription,
  SourceLocation,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import classnames from "classnames";
import mapValues from "lodash/mapValues";
import { CSSProperties, ReactNode, Suspense, useContext, useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import {
  Cache,
  StreamingCache,
  createCache,
  createSingleEntryCache,
  createStreamingCache,
  useImperativeCacheValue,
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
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { hitPointsCache, hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { getPointAndTimeForPauseId, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { getPointDescriptionForFrame } from "replay-next/src/suspense/PointStackCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import {
  sourcesByIdCache,
  streamingSourceContentsCache,
  useSourcesById,
  useSourcesByUrl,
} from "replay-next/src/suspense/SourcesCache";
import { Source, sourcesByPartialUrlCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceToDisplayForUrl } from "replay-next/src/utils/sources";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import {
  MORE_IGNORABLE_PARTIAL_URLS,
  formatEventListener,
} from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { SourceDetails, SourcesState, getSourceIdsByUrl } from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseFramesAsync } from "ui/suspense/frameCache";
import {
  FormattedPointStack,
  FormattedPointStackFrame,
  formatPointStackForPoint,
  formatPointStackFrame,
} from "ui/suspense/frameCache";

import MaterialIcon from "./shared/MaterialIcon";
import cardsListStyles from "ui/components/Comments/CommentCardsList.module.css";
import styles from "./Events/Event.module.css";

interface PointWithLocation {
  location: Location;
  point: TimeStampedPoint;
}

interface ReactQueuedRenderDetails extends TimeStampedPoint {
  pauseFrames: PauseFrame[];
  filteredPauseFrames: PauseFrame[];
  userPauseFrame: PauseFrame;
}

export const reactRenderQueuedJumpLocationCache: Cache<
  [replayClient: ReplayClientInterface, earliestAppCodeFrame: PauseFrame],
  PointWithLocation | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ReactRenderQueuedJumpLocation",
  getKey: ([replayClient, earliestAppCodeFrame]) =>
    `${earliestAppCodeFrame.pauseId}:${earliestAppCodeFrame.index}`,
  load: async ([replayClient, earliestAppCodeFrame]) => {
    if (!earliestAppCodeFrame) {
      return;
    }

    // This should already be a "preferred" location thanks to it being a `PauseFrame`
    const { location } = earliestAppCodeFrame;
    const [executionPoint] = getPointAndTimeForPauseId(earliestAppCodeFrame.pauseId);
    if (!executionPoint) {
      return;
    }

    const pointDescription = await getPointDescriptionForFrame(
      replayClient,
      executionPoint,
      earliestAppCodeFrame.index
    );

    return {
      location,
      point: {
        point: pointDescription.point,
        time: pointDescription.time,
      },
    };
  },
});

interface ReactInternalMethodsHits {
  scheduleUpdateHitPoints: TimeStampedPoint[];
  renderRootSyncHitPoints: TimeStampedPoint[];
  onCommitFiberHitPoints: TimeStampedPoint[];
}

interface ReactInternalFunctionSearchMarkers {
  functionName: string;
  uniqueProdMinifiedText: string;
}

export const reactInternalFunctionsToFind = {
  // A build-extracted React error code
  scheduleUpdateOnFiber: "(185)",
  // A build-extracted React error code
  renderRootSync: "(261)",
  // A call to the React DevTools global hook object
  onCommitRoot: ".onCommitFiberRoot(",
  // The initial assignments inside the function
  renderWithHooks: ".updateQueue = null",
  // The only place in the codebase that calls `instance.render()`
  finishClassComponent: ".render(",
};

export type ReactInternalFunctionName = keyof typeof reactInternalFunctionsToFind;

interface ReactInternalFunctionDetailsEntry2 {
  functionName: string;
  functionOutline: FunctionOutline;
  lineIndex?: number;
}

interface ReactInternalFunctionDetailsEntry {
  functionName: string;
  functionOutline: FunctionOutline;
  lineIndex?: number;
  hits?: TimeStampedPoint[];
}

type ReactInternalFunctionDetails = {
  [key in ReactInternalFunctionName]: ReactInternalFunctionDetailsEntry;
};

const reactInternalMethodsDetailsCache: Cache<
  [replayClient: ReplayClientInterface, functionName: ReactInternalFunctionName],
  ReactInternalFunctionDetailsEntry2 | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ReactInternalMethodsDetails",
  getKey: ([replayClient, functionName]) => functionName,
  load: async ([replayClient, functionName]) => {
    let functionDetails: ReactInternalFunctionDetailsEntry2 | undefined = undefined;

    const reactDomSources = await sourcesByPartialUrlCache.readAsync(replayClient, "react-dom.");
    if (!reactDomSources.length) {
      return;
    }

    // TODO There could be more than one here. We'll take the first.
    const reactDomSource = reactDomSources[0];

    const symbols = await sourceOutlineCache.readAsync(replayClient, reactDomSource.id);

    if (!symbols) {
      return;
    }

    // Start by seeing if we can find the function in the outline.
    function getFunctionDetailsFromOutline() {
      const matchingFunction = symbols.functions.find(f => f.name?.startsWith(functionName));

      if (matchingFunction) {
        functionDetails = {
          functionName,
          functionOutline: matchingFunction,
        };
      }
    }

    if (!functionDetails) {
      const reactDomSourceLines = await reactDomLinesCache.readAsync(
        replayClient,
        functionName,
        reactDomSource
      );

      const searchString = reactInternalFunctionsToFind[functionName];

      // HACK We'll do this the hard way! This _should_ mostly work back to React 16.14
      // By careful inspection, we know that every minified version of `scheduleUpdateOnFiber`
      // has a React extracted error code call of `someErrorFn(185)`. We also know that every
      // minified version of `onCommitRoot` looks for the `.onCommitFiberRoot` function on the
      // React DevTools global hook.
      // By doing line-by-line string comparisons looking for these specific bits of code,
      // we can consistently find the specific minified functions that we care about,
      // across multiple React production builds, without needing to track minified function names.
      // TODO Rethink this one React has sourcemaps

      for (let [lineZeroIndex, line] of reactDomSourceLines.entries()) {
        let columnMatch = line.indexOf(searchString);
        if (functionName === "renderWithHooks" && columnMatch > -1) {
          // This shows up in a few places, check before
          // TODO This is probably only accurate for React 18.x?
          const isRightFunction =
            reactDomSourceLines[lineZeroIndex - 1].includes("memoizedState = null") &&
            reactDomSourceLines[lineZeroIndex + 1].includes("lanes = 0");
          if (!isRightFunction) {
            columnMatch = -1;
          }
        }

        if (columnMatch > -1) {
          const location: SourceLocation = { line: lineZeroIndex + 1, column: columnMatch };
          const functionOutline = findFunctionOutlineForLocation(location, symbols);

          if (functionOutline) {
            functionDetails = {
              functionName,
              functionOutline,
              lineIndex: lineZeroIndex + 1,
            };
          }
        }
      }
    }

    console.log("React internal method lookup: ", functionName, functionDetails);
    return functionDetails;
  },
});

const reactDomLinesCache: Cache<
  [
    replayClient: ReplayClientInterface,
    functionName: ReactInternalFunctionName,
    reactDomSource: SourceDetails
  ],
  string[]
> = createSingleEntryCache({
  debugLabel: "ReactDomLines",
  async load([replayClient, functionName, reactDomSource]) {
    const streaming = streamingSourceContentsCache.stream(replayClient, reactDomSource.id);
    await streaming.resolver;

    const reactDomSourceContents = streaming.value!;
    return reactDomSourceContents.split("\n");
  },
});

export const reactInternalMethodsHitsIntervalCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, functionName: ReactInternalFunctionName],
  PointDescription
>({
  debugLabel: "RecordedProtocolMessages",
  getPointForValue: data => data.point,
  async load(rangeStart, rangeEnd, replayClient, functionName) {
    if (!rangeStart || !rangeEnd) {
      return [];
    }

    const functionDetails = await reactInternalMethodsDetailsCache.readAsync(
      replayClient,
      functionName
    );

    if (!functionDetails) {
      return [];
    }

    const reactDomSources = await sourcesByPartialUrlCache.readAsync(replayClient, "react-dom.");

    if (!reactDomSources.length) {
      return [];
    }

    // TODO There could be more than one here. We'll take the first.
    const reactDomSource = reactDomSources[0];

    // We found a function outline, so we can use that to get the hits.
    const hitPoints = await hitPointsCache.readAsync(
      BigInt(rangeStart),
      BigInt(rangeEnd),
      replayClient,
      { ...functionDetails.functionOutline.breakpointLocation!, sourceId: reactDomSource.id },
      null
    );

    return hitPoints;
  },
});

type ReactUpdateScheduled = {
  type: "scheduled";
  cause: "user" | "internal" | "unknown";
} & FormattedPointStack;

type ReactSyncUpdatedStarted = {
  type: "sync_started";
} & FormattedPointStack;

type ReactRenderCommitted = {
  type: "render_committed";
} & FormattedPointStack;

type ReactRenderEntry = ReactUpdateScheduled | ReactSyncUpdatedStarted | ReactRenderCommitted;

export const reactRendersIntervalCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface],
  ReactRenderEntry
>({
  debugLabel: "ReactRenders",
  getPointForValue: data => data.point.point,
  async load(rangeStart, rangeEnd, replayClient) {
    if (!rangeStart || !rangeEnd) {
      return [];
    }

    console.log("Getting React renders");

    const methodNames: ReactInternalFunctionName[] = [
      "scheduleUpdateOnFiber",
      "renderRootSync",
      "onCommitRoot",
    ];

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);

    const [scheduleUpdateHits, renderRootSyncHits, onCommitRootHits] = await Promise.all(
      methodNames.map(methodName => {
        return reactInternalMethodsHitsIntervalCache.readAsync(
          BigInt(rangeStart),
          BigInt(rangeEnd),
          replayClient,
          methodName
        );
      })
    );

    const scheduleUpdateEntries: ReactUpdateScheduled[] = await Promise.all(
      scheduleUpdateHits.map(async hit => {
        const mostlyFormattedPointStack = await formatPointStackForPoint(replayClient, hit);

        const cause = mostlyFormattedPointStack.frame ? "user" : "unknown";

        return {
          type: "scheduled",
          cause,
          ...mostlyFormattedPointStack,
        };
      })
    );

    const renderRootSyncEntries: ReactSyncUpdatedStarted[] = await Promise.all(
      renderRootSyncHits.map(async hit => {
        const mostlyFormattedPointStack = await formatPointStackForPoint(replayClient, hit);

        return {
          type: "sync_started",
          ...mostlyFormattedPointStack,
        };
      })
    );

    const onCommitRootEntries: ReactRenderCommitted[] = await Promise.all(
      onCommitRootHits.map(async hit => {
        const mostlyFormattedPointStack = await formatPointStackForPoint(replayClient, hit);

        return {
          type: "render_committed",
          ...mostlyFormattedPointStack,
        };
      })
    );

    console.log("Schedule update entries: ", scheduleUpdateEntries);
    console.log("Sync Root entries: ", renderRootSyncEntries);
    console.log("On commit root entries: ", onCommitRootEntries);

    const allEntries: ReactRenderEntry[] = [
      ...scheduleUpdateEntries,
      ...renderRootSyncEntries,
      ...onCommitRootEntries,
    ];

    allEntries.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));
    return allEntries;
  },
});

export const reactInternalMethodsHitsCache: Cache<
  [
    replayClient: ReplayClientInterface,
    range: TimeStampedPointRange | null,
    reactDomSource: SourceDetails | undefined,
    sourcesState: SourcesState
  ],
  ReactInternalFunctionDetails | undefined
> = createSingleEntryCache({
  async load([replayClient, range, reactDomSource, sourcesState]) {
    if (!reactDomSource || !range) {
      return;
    }

    const symbols = await sourceOutlineCache.readAsync(replayClient, reactDomSource.id);

    if (!symbols) {
      return;
    }

    const reactInternalFunctionDetails: ReactInternalFunctionDetails = mapValues(
      reactInternalFunctionsToFind,
      (regex, functionName) =>
        ({
          functionName,
        } as ReactInternalFunctionDetailsEntry)
    );

    if (reactDomSource.url!.includes(".development")) {
      for (const functionName of Object.keys(reactInternalFunctionsToFind)) {
        const matchingFunction = symbols.functions.find(f => f.name?.startsWith(functionName))!;
        reactInternalFunctionDetails[
          functionName as keyof typeof reactInternalFunctionsToFind
        ].functionOutline = matchingFunction;
      }
      // const shouldUpdateFiberSymbol = symbols?.functions.find(
      //   f => f.name === "scheduleUpdateOnFiber"
      // )!;
      // const renderRootSyncSymbol = symbols?.functions.find(f => f.name === "renderRootSync")!;
      // const onCommitRootSymbol = symbols?.functions.find(f => f.name === "onCommitRoot")!;

      // scheduleUpdateFiberDeclaration = shouldUpdateFiberSymbol;
      // renderRootSyncDeclaration = renderRootSyncSymbol;
      // onCommitFiberRootDeclaration = onCommitRootSymbol;
    } else if (
      reactDomSource.url!.includes(".production") ||
      reactDomSource.url!.includes(".profiling")
    ) {
      // HACK We'll do this the hard way! This _should_ work back to React 16.14
      // By careful inspection, we know that every minified version of `scheduleUpdateOnFiber`
      // has a React extracted error code call of `someErrorFn(185)`. We also know that every
      // minified version of `onCommitRoot` looks for the `.onCommitFiberRoot` function on the
      // React DevTools global hook.
      // By doing line-by-line string comparisons looking for these specific bits of code,
      // we can consistently find the specific minified functions that we care about,
      // across multiple React production builds, without needing to track minified function names.
      // TODO Rethink this one React has sourcemaps

      const streaming = streamingSourceContentsCache.stream(replayClient, reactDomSource!.id);
      await streaming.resolver;

      const reactDomSourceLines = streaming.value!.split("\n");

      /*
      // A build-extracted React error code
      const MAGIC_SCHEDULE_UPDATE_CONTENTS = "(185)";
      // A build-extracted React error code
      const MAGIC_RENDER_ROOT_SYNC_CONTENTS = "(261)";
      // A call to the React DevTools global hook object
      const MAGIC_ON_COMMIT_ROOT_CONTENTS = ".onCommitFiberRoot(";
      */

      // Brute-force search over all lines in the file to find the functions that we
      // actually care about, based on the magic strings that will exist.
      console.log("reactDomSourceLines: ", reactDomSourceLines);
      for (let [lineZeroIndex, line] of reactDomSourceLines.entries()) {
        // if (line.includes("updateQueue = null")) {
        //   console.log("updateQueue=null check: ", lineZeroIndex, line);
        // }
        for (const [functionName, searchString] of Object.entries(reactInternalFunctionsToFind)) {
          const key = functionName as keyof typeof reactInternalFunctionsToFind;
          let columnMatch = line.indexOf(searchString);
          if (functionName === "renderWithHooks" && columnMatch > -1) {
            // This shows up in a few places, check before
            const isRightFunction =
              reactDomSourceLines[lineZeroIndex - 1].includes("memoizedState = null") &&
              reactDomSourceLines[lineZeroIndex + 1].includes("lanes = 0");
            if (!isRightFunction) {
              columnMatch = -1;
            }
          }

          if (columnMatch > -1) {
            const functionDetails = reactInternalFunctionDetails[key];
            functionDetails.lineIndex = lineZeroIndex + 1;
            const location: SourceLocation = { line: lineZeroIndex + 1, column: columnMatch };
            console.log("Found location: ", functionName, location);
            functionDetails.functionOutline = findFunctionOutlineForLocation(location, symbols)!;
          }
        }
        /*
        const scheduleUpdateIndex = line.indexOf(MAGIC_SCHEDULE_UPDATE_CONTENTS);
        const renderRootSyncIndex = line.indexOf(MAGIC_RENDER_ROOT_SYNC_CONTENTS);
        const onCommitIndex = line.indexOf(MAGIC_ON_COMMIT_ROOT_CONTENTS);
        if (scheduleUpdateIndex > -1) {
          scheduleUpdateFiberDeclaration = findFunctionOutlineForLocation(
            {
              line: lineZeroIndex + 1,
              column: scheduleUpdateIndex,
            },
            symbols
          );
        }
        if (renderRootSyncIndex > -1) {
          renderRootSyncDeclaration = findFunctionOutlineForLocation(
            {
              line: lineZeroIndex + 1,
              column: renderRootSyncIndex,
            },
            symbols
          );
        }
        if (onCommitIndex > -1) {
          onCommitFiberRootDeclaration = findFunctionOutlineForLocation(
            {
              line: lineZeroIndex + 1,
              column: scheduleUpdateIndex,
            },
            symbols
          );
        }

        if (
          scheduleUpdateFiberDeclaration &&
          renderRootSyncDeclaration &&
          onCommitFiberRootDeclaration
        ) {
          break;
        }
        */
      }
    }

    if (
      !Object.values(reactInternalFunctionDetails).every(f => f.functionOutline?.breakpointLocation)
    ) {
      console.log("Bailing out of internals check: ", reactInternalFunctionDetails);
      return;
    }

    /*
    if (
      !scheduleUpdateFiberDeclaration?.breakpointLocation ||
      !renderRootSyncDeclaration?.breakpointLocation ||
      !onCommitFiberRootDeclaration?.breakpointLocation
    ) {
      return;
    }

    const firstScheduleUpdateFiberPosition = scheduleUpdateFiberDeclaration.breakpointLocation;
    const firstRenderRootSyncPosition = renderRootSyncDeclaration.breakpointLocation;
    const firstOnCommitRootPosition = onCommitFiberRootDeclaration.breakpointLocation

    if (
      !firstScheduleUpdateFiberPosition ||
      !firstRenderRootSyncPosition ||
      !firstOnCommitRootPosition
    ) {
      return;
    }

    */

    console.log("React internal function details: ", reactInternalFunctionDetails, reactDomSource);
    await Promise.all(
      Object.entries(reactInternalFunctionDetails).map(async ([key, details]) => {
        const hitPoints = await hitPointsCache.readAsync(
          BigInt(range.begin.point),
          BigInt(range.end.point),
          replayClient,
          { ...details.functionOutline.breakpointLocation!, sourceId: reactDomSource.id },
          null
        );
        details.hits = hitPoints;
      })
    );

    return reactInternalFunctionDetails;
  },
});

export function jumpToTimeAndLocationForQueuedRender(
  hitPoint: TimeStampedPoint,
  location: Location | undefined,
  jumpBehavior: "timeOnly" | "timeAndLocation",
  onSeek: (point: ExecutionPoint, time: number) => void
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    onSeek(hitPoint.point, hitPoint.time);
    // const sourcesState = getState().sources;
    // const jumpLocation = await reactRenderQueuedJumpLocationCache.readAsync(
    //   replayClient,
    //   earliestAppCodeFrame,
    //   sourcesState
    // );
    // if (jumpLocation) {
    //   if (jumpLocation.point) {
    //     onSeek(jumpLocation.point.point, jumpLocation.point.time);
    //   }

    if (jumpBehavior === "timeAndLocation" && location) {
      const cx = getThreadContext(getState());
      dispatch(selectLocation(cx, location));
    }
  };
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

interface QueuedRenderItemData {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
  entries: ReactUpdateScheduled[];
}

function ReactQueuedRenderListItem({
  data,
  index,
  style,
}: {
  data: QueuedRenderItemData;
  index: number;
  style: CSSProperties;
}) {
  const dispatch = useAppDispatch();
  const renderDetails = data.entries[index];
  const { executionPoint, onSeek, currentTime } = data;
  const { point, frame, functionName, resultPoint } = renderDetails;
  const isPaused = point.time === currentTime && executionPoint === point.point;
  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const onMouseEnter = () => {};

  const onMouseLeave = () => {};

  const onClickSeek = (e: React.MouseEvent) => {
    e.stopPropagation();

    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        resultPoint,
        frame?.executionLocation,
        "timeOnly",
        onSeek
      )
    );
  };

  const onClickJumpToCode = async () => {
    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        resultPoint,
        frame?.executionLocation,
        "timeAndLocation",
        onSeek
      )
    );
  };

  let eventType = "react";
  if (renderDetails.allFrames.some(frame => frame.source?.url?.includes("react-redux"))) {
    eventType = "redux";
  }

  return (
    <div style={style}>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < point.time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClickSeek}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          {eventType ? (
            <AccessibleImage className={`${eventType} `} />
          ) : (
            <MaterialIcon iconSize="xl">ads_click</MaterialIcon>
          )}
          <Label>{functionName ?? "Unknown"}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={renderDetails.point.point}
            />
          }
        </div>
      </div>
    </div>
  );
}

export const getReactDomSourceUrl = createSelector(getSourceIdsByUrl, sourcesByUrl => {
  const reactDomUrl = Object.keys(sourcesByUrl).find(key => {
    return key.includes("react-dom.");
  });
  return reactDomUrl;
});

export function ReactPanelSuspends() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { range: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);

  const allReactRenderEntries = reactRendersIntervalCache.read(
    BigInt(focusRange!.begin.point),
    BigInt(focusRange!.end.point),
    replayClient
  );

  const itemData: QueuedRenderItemData = useMemo(() => {
    const allScheduledEntries = allReactRenderEntries.filter(
      (entry): entry is ReactUpdateScheduled => entry.type === "scheduled"
    );
    const onlyUserEntries = allScheduledEntries.filter(entry => entry.cause === "user");
    const onSeek = (executionPoint: string, time: number) => {
      dispatch(seek({ executionPoint, time }));
    };

    return {
      executionPoint: executionPoint!,
      currentTime,
      entries: onlyUserEntries,
      onSeek,
    };
  }, [allReactRenderEntries, dispatch, currentTime, executionPoint]);

  // TODO Add the red "current time" line from `Events.tsx`

  /*
  
      */
  /*
    {onlyUserEntries.map((entry, i) => (
        <div key={entry.point.point}>
          <div className="px-1.5">
            <ReactQueuedRenderListItem
              currentTime={currentTime}
              executionPoint={executionPoint!}
              renderDetails={entry}
              onSeek={onSeek}
              key={entry.point.point}
            />
          </div>
        </div>
      ))}
  */

  return (
    <div style={{ flex: "1 1 auto", height: "100%" }}>
      <AutoSizer disableWidth>
        {({ height }: { height: number }) => {
          return (
            <List
              children={ReactQueuedRenderListItem}
              height={height}
              itemCount={itemData.entries.length}
              itemData={itemData}
              itemSize={30}
              // outerRef={outerRef}
              width="100%"
            />
          );
        }}
      </AutoSizer>
    </div>
  );
}

export function ReactPanel() {
  const { range: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);

  const allSourcesReceived = useAppSelector(state => state.sources.allSourcesReceived);
  if (!focusRange?.begin) {
    return <div>No focus range</div>;
  } else if (!allSourcesReceived) {
    return <div>Loading sources...</div>;
  }

  return (
    <div className={cardsListStyles.Sidebar}>
      <div className={cardsListStyles.Toolbar}>
        <div className={cardsListStyles.ToolbarHeader}>React State Updates</div>
      </div>
      <Suspense
        fallback={
          <div style={{ flexShrink: 1 }}>
            <IndeterminateLoader />
          </div>
        }
      >
        <ReactPanelSuspends />
      </Suspense>
    </div>
  );
}

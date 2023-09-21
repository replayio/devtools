import {
  FunctionOutline,
  Location,
  PointDescription,
  SourceLocation,
  TimeStampedPoint,
} from "@replayio/protocol";
import { Cache, createCache, createSingleEntryCache } from "suspense";

import { PauseFrame } from "devtools/client/debugger/src/reducers/pause";
import { createFocusIntervalCacheForExecutionPoints } from "replay-next/src/suspense/FocusIntervalCache";
import { hitPointsCache } from "replay-next/src/suspense/HitPointsCache";
import { getPointAndTimeForPauseId } from "replay-next/src/suspense/PauseCache";
import { getPointDescriptionForFrame } from "replay-next/src/suspense/PointStackCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByPartialUrlCache } from "replay-next/src/suspense/SourcesCache";
import {
  sourcesByIdCache,
  streamingSourceContentsCache,
} from "replay-next/src/suspense/SourcesCache";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { SourceDetails } from "ui/reducers/sources";
import { FormattedPointStack, formatPointStackForPoint } from "ui/suspense/frameCache";

interface PointWithLocation {
  location: Location;
  point: TimeStampedPoint;
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

export type ReactUpdateScheduled = {
  type: "scheduled";
  cause: "user" | "internal" | "unknown";
} & FormattedPointStack;

export type ReactSyncUpdatedStarted = {
  type: "sync_started";
} & FormattedPointStack;

export type ReactRenderCommitted = {
  type: "render_committed";
} & FormattedPointStack;

export type ReactRenderEntry =
  | ReactUpdateScheduled
  | ReactSyncUpdatedStarted
  | ReactRenderCommitted;

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

    const allEntries: ReactRenderEntry[] = [
      ...scheduleUpdateEntries,
      ...renderRootSyncEntries,
      ...onCommitRootEntries,
    ];

    allEntries.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));
    return allEntries;
  },
});

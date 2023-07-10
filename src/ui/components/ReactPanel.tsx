import { createSelector } from "@reduxjs/toolkit";
import {
  ExecutionPoint,
  FunctionOutline,
  Location,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import classnames from "classnames";
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
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/HitPointsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import {
  SourceDetails,
  SourcesState,
  getSourceIdsByUrl,
  getSourceToDisplayForUrl,
} from "ui/reducers/sources";
import { getPreferredLocation } from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseFramesAsync } from "ui/suspense/frameCache";

import MaterialIcon from "./shared/MaterialIcon";
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

export const reactRenderQueuedJumpLocationCache: Cache<
  [
    replayClient: ReplayClientInterface,
    earliestAppCodeFrame: PauseFrame,
    sourcesState: SourcesState
  ],
  PointWithLocation | undefined
> = createCache({
  config: { immutable: true },
  debugLabel: "ReactRenderQueuedJumpLocation",
  getKey: ([replayClient, earliestAppCodeFrame, sourcesState]) => earliestAppCodeFrame.pauseId,
  load: async ([replayClient, earliestAppCodeFrame, sourcesState]) => {
    let userPauseFrameTime: TimeStampedPoint | undefined = undefined;

    if (!earliestAppCodeFrame) {
      return;
    }

    // This should already be a "preferred" location thanks to it being a `PauseFrame`
    const { location } = earliestAppCodeFrame;

    const initialPreferredLocation = getPreferredLocation(sourcesState, [location]);

    let { line, sourceId, column } = initialPreferredLocation;

    const [breakablePositions, breakablePositionsByLine] = await breakpointPositionsCache.readAsync(
      replayClient,
      sourceId
    );
    const breakablePositionsForLine = breakablePositionsByLine.get(line);

    try {
      // TODO Need a _much_ better way of identifying the exact point of the earlier frame!
      // This also doesn't seem to consistently work with the _first_ render.
      // const arbitraryStartPoint = hitPoint.time - 50;
      // const pointNearTime = await replayClient.getPointNearTime(arbitraryStartPoint);
      // const functionHits: AnalysisInput[] = await replayClient.runAnalysis<AnalysisInput>({
      //   effectful: false,
      //   mapper: getFunctionBody(hitMapper),
      //   location,
      //   range: {
      //     begin: pointNearTime.point,
      //     end: hitPoint.point,
      //   },
      // });
      // [userPauseFrameTime] = functionHits.slice(-1);

      // We know the pause + point _inside_ of React.
      // We now need to find the right execution point within that earlier frame.

      // TODO [BAC-2915] Frame step locations and times don't consistently line up right!
      if (breakablePositionsForLine) {
        column = breakablePositionsForLine.columns[0];
      }

      const searchLocation: Location = { sourceId, line, column };

      const frameSteps = await frameStepsCache.readAsync(
        replayClient,
        earliestAppCodeFrame.pauseId,
        earliestAppCodeFrame.protocolId
      );

      const pointsWithLocations =
        frameSteps?.flatMap(step => {
          return step.frame
            ?.map(l => {
              return {
                location: l,
                point: step,
              };
            })
            .filter(Boolean) as PointWithLocation[];
        }) ?? [];

      // One of these locations should match up
      const matchingFrameStep: PointWithLocation | undefined = pointsWithLocations.find(step => {
        // Intentionally ignore columns for now - this seems to produce better results
        // that line up with the hit points in a print statement
        return (
          step.location.sourceId === searchLocation.sourceId &&
          step.location.line === searchLocation.line
        );
      });

      if (matchingFrameStep) {
        userPauseFrameTime = matchingFrameStep.point;
      }

      return {
        location: searchLocation,
        point: userPauseFrameTime,
      };

      // TODO Use scope mapping ala `event-listeners.ts` to get better function names
    } catch (err) {
      console.error(err);
    }
  },
});

const queuedRendersStreamingCache: StreamingCache<
  [
    replayClient: ReplayClientInterface,
    range: TimeStampedPointRange | null,
    reactDomSource: SourceDetails | undefined,
    sourcesState: SourcesState
  ],
  ReactQueuedRenderDetails[] | undefined
> = createStreamingCache({
  getKey: (replayClient, range, reactDomSource, sourcesState) =>
    `${range?.begin.point}:${range?.end.point}`,
  load: async ({ update, resolve, reject }, replayClient, range, reactDomSource, sourcesState) => {
    if (!reactDomSource || !range) {
      resolve();
      return;
    }
    try {
      const [symbols, breakablePositionsResult] = await Promise.all([
        sourceOutlineCache.readAsync(replayClient, reactDomSource.id),
        breakpointPositionsCache.readAsync(replayClient, reactDomSource.id),
      ]);

      if (!symbols) {
        return;
      }

      const [breakablePositions, breakablePositionsByLine] = breakablePositionsResult;

      let scheduleUpdateFiberDeclaration: FunctionOutline | undefined;
      let onCommitFiberRootDeclaration: FunctionOutline | undefined;

      if (reactDomSource.url!.includes(".development")) {
        const shouldUpdateFiberSymbol = symbols?.functions.find(
          f => f.name === "scheduleUpdateOnFiber"
        )!;
        const onCommitRootSymbol = symbols?.functions.find(f => f.name === "onCommitRoot")!;

        scheduleUpdateFiberDeclaration = shouldUpdateFiberSymbol;
        onCommitFiberRootDeclaration = onCommitRootSymbol;
      } else if (reactDomSource.url!.includes(".production")) {
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

        // A build-extracted React error code
        const MAGIC_SCHEDULE_UPDATE_CONTENTS = "(185)";
        // A call to the React DevTools global hook object
        const MAGIC_ON_COMMIT_ROOT_CONTENTS = ".onCommitFiberRoot(";

        // Brute-force search over all lines in the file to find the two functions that we
        // actually care about, based on the magic strings that will exist.
        for (let [lineZeroIndex, line] of reactDomSourceLines.entries()) {
          const scheduleUpdateIndex = line.indexOf(MAGIC_SCHEDULE_UPDATE_CONTENTS);
          const onCommitIndex = line.indexOf(MAGIC_ON_COMMIT_ROOT_CONTENTS);
          if (scheduleUpdateIndex > -1) {
            scheduleUpdateFiberDeclaration = findFunctionOutlineForLocation(
              {
                line: lineZeroIndex + 1,
                column: scheduleUpdateIndex,
              },
              symbols
            );
            /*
            const res = findClosestofSymbol(symbols.functions, {
              line: lineZeroIndex + 1,
              column: scheduleUpdateIndex,
            });
            if (res) {
              scheduleUpdateFiberDeclaration = res.location.begin;
            }
            */
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

          if (scheduleUpdateFiberDeclaration && onCommitFiberRootDeclaration) {
            break;
          }
        }
      }

      if (
        !scheduleUpdateFiberDeclaration?.breakpointLocation ||
        !onCommitFiberRootDeclaration?.breakpointLocation
      ) {
        return;
      }

      const firstScheduleUpdateFiberPosition = scheduleUpdateFiberDeclaration.breakpointLocation;

      const firstOnCommitRootPosition = onCommitFiberRootDeclaration.breakpointLocation;

      if (!firstScheduleUpdateFiberPosition || !firstOnCommitRootPosition) {
        return;
      }

      const scheduleFiberUpdatePromise = getHitPointsForLocationAsync(
        replayClient,
        { ...firstScheduleUpdateFiberPosition, sourceId: reactDomSource.id },
        null,
        { begin: range.begin.point, end: range.end.point }
      );

      const onCommitFiberHitsPromise = getHitPointsForLocationAsync(
        replayClient,
        { ...firstOnCommitRootPosition, sourceId: reactDomSource.id },
        null,
        { begin: range.begin.point, end: range.end.point }
      );

      const [[scheduleUpdateHitPoints], [onCommitFiberHitPoints]] = await Promise.all([
        scheduleFiberUpdatePromise,
        onCommitFiberHitsPromise,
      ]);

      // TODO Arbitrary max of 200 points here. We need to figure out a better strategy.
      const scheduleUpdateHitPointsToCheck = scheduleUpdateHitPoints.slice(0, 200);

      let currentResults: ReactQueuedRenderDetails[] = [];

      for (let [index, hitPoint] of scheduleUpdateHitPointsToCheck.entries()) {
        // We know a time that React's internal "schedule a render" logic ran. Start with that time.
        const pauseId = await pauseIdCache.readAsync(replayClient, hitPoint.point, hitPoint.time);

        // Get the stack frames for that call.
        const pauseFrames = (await getPauseFramesAsync(replayClient, pauseId, sourcesState)) ?? [];
        const filteredPauseFrames = pauseFrames.filter(frame => {
          const { source } = frame;
          if (!source) {
            return false;
          }
          // Filter out everything in `node_modules`, so we have just app code left
          // TODO There may be times when we care about renders queued by lib code
          // TODO See about just filtering out React instead?
          return !MORE_IGNORABLE_PARTIAL_URLS.some(partialUrl => source.url?.includes(partialUrl));
        });

        // We want the oldest app stack frame, which should be what called `setState()`
        let earliestAppCodeFrame: PauseFrame | undefined = filteredPauseFrames.slice(-1)[0];

        const result: ReactQueuedRenderDetails = {
          ...hitPoint,
          pauseFrames,
          filteredPauseFrames,
          userPauseFrame: earliestAppCodeFrame,
        };

        currentResults = currentResults.concat(result);

        update(currentResults);
      }

      resolve();
    } catch (err) {
      console.error("Error getting React render data: ", err);
      reject(err);
    }
  },
});

function jumpToTimeAndLocationForQueuedRender(
  earliestAppCodeFrame: PauseFrame,
  hitPoint: TimeStampedPoint,
  jumpBehavior: "timeOnly" | "timeAndLocation",
  onSeek: (point: ExecutionPoint, time: number) => void
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const sourcesState = getState().sources;
    const jumpLocation = await reactRenderQueuedJumpLocationCache.readAsync(
      replayClient,
      earliestAppCodeFrame,
      sourcesState
    );
    if (jumpLocation) {
      if (jumpLocation.point) {
        onSeek(jumpLocation.point.point, jumpLocation.point.time);
      }

      if (jumpBehavior === "timeAndLocation") {
        const cx = getThreadContext(getState());
        dispatch(selectLocation(cx, jumpLocation.location));
      }
    }
  };
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

function ReactQueuedRenderListItem({
  currentTime,
  renderDetails,
  executionPoint,
  onSeek,
}: {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
  renderDetails: ReactQueuedRenderDetails;
}) {
  const dispatch = useAppDispatch();
  const { userPauseFrame, point, time } = renderDetails;
  const isPaused = time === currentTime && executionPoint === point;
  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  if (!userPauseFrame) {
    return null;
  }

  const hitPoint: TimeStampedPoint = { point, time };

  const onMouseEnter = () => {};

  const onMouseLeave = () => {};

  const onClickSeek = (e: React.MouseEvent) => {
    e.stopPropagation();

    dispatch(jumpToTimeAndLocationForQueuedRender(userPauseFrame, hitPoint, "timeOnly", onSeek));
  };

  const onClickJumpToCode = async () => {
    dispatch(
      jumpToTimeAndLocationForQueuedRender(userPauseFrame, hitPoint, "timeAndLocation", onSeek)
    );
  };

  let eventType = "react";
  if (renderDetails.pauseFrames.some(frame => frame.source?.url?.includes("react-redux"))) {
    eventType = "redux";
  }

  return (
    <>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
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
          <Label>{simplifyDisplayName(userPauseFrame!.displayName)}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={renderDetails.point}
            />
          }
        </div>
      </div>
    </>
  );
}

const getReactDomSourceUrl = createSelector(getSourceIdsByUrl, sourcesByUrl => {
  const reactDomUrl = Object.keys(sourcesByUrl).find(key => {
    return key.includes("react-dom.");
  });
  return reactDomUrl;
});

export function ReactPanel() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const replayClient = useContext(ReplayClientContext);
  const { rangeForDisplay: focusRange } = useContext(FocusContext);

  const reactDomSourceUrl = useAppSelector(getReactDomSourceUrl);
  const sourcesState = useAppSelector(state => state.sources);
  const reactDomSource = useAppSelector(state => {
    if (!reactDomSourceUrl) {
      return undefined;
    }

    const reactDomSource = getSourceToDisplayForUrl(state, reactDomSourceUrl);
    if (!reactDomSource || !reactDomSource.url) {
      return;
    }

    return reactDomSource;
  });

  const streamingValue = queuedRendersStreamingCache.stream(
    replayClient,
    focusRange,
    reactDomSource,
    sourcesState
  );
  const streamingRes = useStreamingValue(streamingValue);
  const { data, progress, value: streamingRenderData } = streamingRes;

  if (!focusRange?.begin) {
    return <div>No focus range</div>;
  } else if (!reactDomSource) {
    if (sourcesState.allSourcesReceived) {
      return <div>ReactDOM not found</div>;
    } else {
      return <div>Loading sources...</div>;
    }
  }

  const onSeek = (point: string, time: number) => {
    // trackEvent("events_timeline.select");
    dispatch(seek(point, time, false));
  };

  const queuedRenders = streamingRenderData?.filter(entry => entry.userPauseFrame) ?? [];

  // TODO Add the red "curent time" line from `Events.tsx`

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {streamingRes.status === "pending" && (
        <div style={{ flexShrink: 1 }}>
          <IndeterminateLoader />
        </div>
      )}
      {queuedRenders.map((entry, i) => (
        <div key={entry.point}>
          <div className="px-1.5">
            <ReactQueuedRenderListItem
              currentTime={currentTime}
              executionPoint={executionPoint!}
              renderDetails={entry}
              onSeek={onSeek}
              key={entry.point}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

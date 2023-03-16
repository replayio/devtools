import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import classnames from "classnames";
import { ReactNode, useContext, useEffect, useState } from "react";

import { selectFrame as selectFrameAction } from "devtools/client/debugger/src/actions/pause/selectFrame";
import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import {
  PauseFrame,
  getExecutionPoint,
  getThreadContext,
} from "devtools/client/debugger/src/reducers/pause";
import type { AstPosition } from "devtools/client/debugger/src/selectors";
import { findClosestofSymbol } from "devtools/client/debugger/src/utils/ast";
import { simplifyDisplayName } from "devtools/client/debugger/src/utils/pause/frames/displayName";
import { AnalysisInput, getFunctionBody } from "protocol/evaluation-utils";
import Icon from "replay-next/components/Icon";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/HitPointsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { UIThunkAction } from "ui/actions";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/event-listeners";
import { seek } from "ui/actions/timeline";
import {
  getAllSourceDetails,
  getSourceIdsByUrl,
  getSourceToDisplayForUrl,
} from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseFramesAsync } from "ui/suspense/frameCache";
import { sourceSymbolsCache } from "ui/suspense/sourceCaches";

import { JumpToCodeStatus, findFirstBreakablePositionForFunction } from "./Events/Event";
import MaterialIcon from "./shared/MaterialIcon";
import styles from "./Events/Event.module.css";

const MORE_IGNORABLE_PARTIAL_URLS = IGNORABLE_PARTIAL_SOURCE_URLS.concat(
  // Ignore _any_ 3rd-party package for now
  "node_modules"
);

interface ReactQueuedRenderDetails extends TimeStampedPoint {
  // frames: Frame[];
  // formattedFrames: FormattedFrame[];
  // filteredFrames: FormattedFrame[];
  pauseFrames: PauseFrame[];
  filteredPauseFrames: PauseFrame[];
  userPauseFrame?: PauseFrame;
  userPauseFrameTime?: TimeStampedPoint;
}

interface RenderAnalysisResults {
  queuedRenders: ReactQueuedRenderDetails[];
  committedRenders: TimeStampedPoint[];
  error?: string;
}

declare let input: AnalysisInput;

export function hitMapper() {
  return [
    {
      key: input.point,
      value: input,
    },
  ];
}

function findQueuedRendersForRange(
  range: TimeStampedPointRange
): UIThunkAction<Promise<RenderAnalysisResults | void>> {
  return async (dispatch, getState, { replayClient }) => {
    try {
      if (!range?.begin) {
        return;
      }

      const sourcesByUrl = getSourceIdsByUrl(getState());
      const allSources = getAllSourceDetails(getState());
      const sourcesState = getState().sources;
      const reactDomUrl = Object.keys(sourcesByUrl).find(key => {
        return key.includes("react-dom.");
      });

      if (!reactDomUrl) {
        return;
      }

      const reactDomSource = getSourceToDisplayForUrl(getState(), reactDomUrl);
      if (!reactDomSource || !reactDomSource.url) {
        return;
      }

      const [symbols, breakablePositionsResult] = await Promise.all([
        sourceSymbolsCache.readAsync(replayClient, reactDomSource.id, allSources),
        breakpointPositionsCache.readAsync(replayClient, reactDomSource.id),
      ]);

      if (!symbols) {
        return;
      }

      const [breakablePositions, breakablePositionsByLine] = breakablePositionsResult;

      let scheduleUpdateFiberDeclaration: AstPosition | undefined;
      let onCommitFiberRootDeclaration: AstPosition | undefined;

      if (reactDomSource.url!.includes(".development")) {
        const shouldUpdateFiberSymbol = symbols?.functions.find(
          f => f.name === "scheduleUpdateOnFiber"
        )!;
        const onCommitRootSymbol = symbols?.functions.find(f => f.name === "onCommitRoot")!;

        scheduleUpdateFiberDeclaration = shouldUpdateFiberSymbol?.location.start;
        onCommitFiberRootDeclaration = onCommitRootSymbol?.location.start;
      } else if (reactDomSource.url!.includes(".production")) {
        // HACK We'll do this the hard way! This _should_ work back to React 16.14
        // By careful inspection, we know that every minified version of `scheduleUpdateOnFiber`
        // has a React extracted error code call of `someErrorFn(185)`. We also know that every
        // minified version of `onCommitRoot` looks for the `.onCommitFiberRoot` function on the
        // React DevTools global hook.
        // By doing line-by-line string comparisons looking for these specific bits of code,
        // we can consistently find the specific minified functions that we care about,
        // across multiple React production builds, without needing to track minified function names.

        const streaming = await streamingSourceContentsCache.read(replayClient, reactDomSource!.id);
        await streaming.resolver;
        const reactDomSourceLines = streaming.contents!.split("\n");

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
            const res = findClosestofSymbol(symbols.functions, {
              line: lineZeroIndex + 1,
              column: scheduleUpdateIndex,
            });
            if (res) {
              scheduleUpdateFiberDeclaration = res.location.start;
            }
          }
          if (onCommitIndex > -1) {
            const res = findClosestofSymbol(symbols.functions, {
              line: lineZeroIndex + 1,
              column: onCommitIndex,
            });
            if (res) {
              onCommitFiberRootDeclaration = res.location.start;
            }
          }

          if (scheduleUpdateFiberDeclaration && onCommitFiberRootDeclaration) {
            break;
          }
        }
      }

      if (!scheduleUpdateFiberDeclaration || !onCommitFiberRootDeclaration) {
        return;
      }

      const firstScheduleUpdateFiberPosition = findFirstBreakablePositionForFunction(
        { ...scheduleUpdateFiberDeclaration, sourceId: reactDomSource.id },
        breakablePositionsByLine
      );
      const firstOnCommitRootPosition = findFirstBreakablePositionForFunction(
        { ...onCommitFiberRootDeclaration, sourceId: reactDomSource.id },
        breakablePositionsByLine
      );
      if (!firstScheduleUpdateFiberPosition || !firstOnCommitRootPosition) {
        return;
      }

      const scheduleFiberUpdatePromise = getHitPointsForLocationAsync(
        replayClient,
        firstScheduleUpdateFiberPosition,
        null,
        { begin: range.begin.point, end: range.end.point }
      );

      const onCommitFiberHitsPromise = getHitPointsForLocationAsync(
        replayClient,
        firstOnCommitRootPosition,
        null,
        { begin: range.begin.point, end: range.end.point }
      );

      const [[scheduleUpdateHitPoints], [onCommitFiberHitPoints]] = await Promise.all([
        scheduleFiberUpdatePromise,
        onCommitFiberHitsPromise,
      ]);

      // TODO Arbitrary max of 200 points here. We need to figure out a better strategy.
      const scheduleUpdateHitPointsToCheck = scheduleUpdateHitPoints.slice(0, 200);
      const queuedRendersPromise = Promise.all(
        scheduleUpdateHitPointsToCheck.map(async (hitPoint): Promise<ReactQueuedRenderDetails> => {
          const pauseId = await pauseIdCache.readAsync(replayClient, hitPoint.point, hitPoint.time);

          const pauseFrames =
            (await getPauseFramesAsync(replayClient, pauseId, sourcesState)) ?? [];
          const filteredPauseFrames = pauseFrames.filter(frame => {
            const { source } = frame;
            if (!source) {
              return false;
            }
            return !MORE_IGNORABLE_PARTIAL_URLS.some(partialUrl =>
              source.url?.includes(partialUrl)
            );
          });

          let userPauseFrame: PauseFrame | undefined = filteredPauseFrames.slice(-1)[0];

          let userPauseFrameTime: TimeStampedPoint | undefined = undefined;

          if (userPauseFrame) {
            try {
              // TODO Need a _much_ better way of identifying the exact point of the earlier frame!
              // This also doesn't seem to consistently work with the _first_ render.
              const arbitraryStartPoint = hitPoint.time - 50;
              const pointNearTime = await replayClient.getPointNearTime(arbitraryStartPoint);
              const { location } = userPauseFrame;
              const functionHits = await replayClient.runAnalysis<AnalysisInput>({
                effectful: false,
                mapper: getFunctionBody(hitMapper),
                location,
                range: {
                  begin: pointNearTime.point,
                  end: hitPoint.point,
                },
              });
              [userPauseFrameTime] = functionHits.slice(-1);

              // TODO Use scope mapping ala `event-listeners.ts` to get better function names
            } catch (err) {
              userPauseFrame = undefined;
            }
          }

          return {
            ...hitPoint,
            pauseFrames,
            filteredPauseFrames,
            userPauseFrame,
            userPauseFrameTime,
          };
        })
      );

      const committedRenders = onCommitFiberHitPoints.slice(0, 200);

      const [queuedRenders] = await Promise.all([queuedRendersPromise]);

      return {
        queuedRenders,
        committedRenders,
      };
    } catch (err) {
      console.error("Error getting React render data: ", err);
      return { error: "failed to fetch events...", queuedRenders: [], committedRenders: [] };
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
  const { point, time } = renderDetails;
  const isPaused = time === currentTime && executionPoint === point;
  const [isHovered, setIsHovered] = useState(false);
  const cx = useAppSelector(getThreadContext);

  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const { userPauseFrame, userPauseFrameTime } = renderDetails;

  if (!userPauseFrame) {
    return null;
  }

  const onMouseEnter = () => {};

  const onMouseLeave = () => {};

  const onClickSeek = () => {
    if (userPauseFrameTime) {
      onSeek(userPauseFrameTime.point, userPauseFrameTime.time);
    }
  };

  const onClickJumpToCode = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Seek to the sidebar event timestamp right away.
    // That way we're at least _close_ to the right time
    onClickSeek();

    dispatch(selectFrameAction(cx, userPauseFrame!));
  };

  const timeLabel =
    executionPoint === null || isExecutionPointsGreaterThan(point, executionPoint)
      ? "fast-forward"
      : "rewind";

  const jumpToCodeButtonAvailable =
    jumpToCodeStatus === "not_checked" || jumpToCodeStatus === "found";

  const jumpToCodeButtonClassname = classnames(
    "transition-width flex items-center justify-center rounded-full  duration-100 ease-out h-6",
    {
      "bg-primaryAccent": jumpToCodeButtonAvailable,
      "bg-gray-400 cursor-default": !jumpToCodeButtonAvailable,
      "px-2 shadow-sm": isHovered,
      "w-6": !isHovered,
    }
  );

  const onJumpButtonMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
  };

  const onJumpButtonMouseLeave = (e: React.MouseEvent) => {
    setIsHovered(false);
  };

  let jumpButtonText = "Jump to code";

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
            <div
              onClick={jumpToCodeButtonAvailable ? onClickJumpToCode : undefined}
              onMouseEnter={onJumpButtonMouseEnter}
              onMouseLeave={onJumpButtonMouseLeave}
              className={jumpToCodeButtonClassname}
            >
              <div className="flex items-center space-x-1">
                {isHovered && <span className="truncate text-white ">{jumpButtonText}</span>}
                <Icon type={timeLabel} className="w-3.5 text-white" />
              </div>
            </div>
          }
        </div>
      </div>
    </>
  );
}

export function ReactPanel() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { rangeForDisplay: focusRange } = useContext(FocusContext);
  const [renderDetails, setRenderDetails] = useState<RenderAnalysisResults | null>(null);

  useEffect(() => {
    setRenderDetails(null);
    (async () => {
      const renderAnalysisResults =
        (await dispatch(findQueuedRendersForRange(focusRange!))) ?? null;
      setRenderDetails(renderAnalysisResults);
    })();
  }, [focusRange, dispatch]);

  const onSeek = (point: string, time: number) => {
    // trackEvent("events_timeline.select");
    dispatch(seek(point, time, false));
  };

  if (!renderDetails) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <IndeterminateLoader />
      </div>
    );
  }

  if (renderDetails.error) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div className="flex h-full items-center justify-center text-gray-400">
          <span>{renderDetails.error}</span>
        </div>
      </div>
    );
  }

  const queuedRenders = renderDetails?.queuedRenders.filter(entry => entry.userPauseFrame) ?? [];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {queuedRenders.map(entry => (
        <ReactQueuedRenderListItem
          currentTime={currentTime}
          executionPoint={executionPoint!}
          renderDetails={entry}
          onSeek={onSeek}
          key={entry.point}
        />
      ))}
    </div>
  );
}

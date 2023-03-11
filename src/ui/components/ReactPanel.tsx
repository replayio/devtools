import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import classnames from "classnames";
import { ReactNode, useContext, useState } from "react";

import { selectFrame as selectFrameAction } from "devtools/client/debugger/src/actions/pause/selectFrame";
import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import {
  PauseFrame,
  getExecutionPoint,
  getThreadContext,
} from "devtools/client/debugger/src/reducers/pause";
import type { AstPosition } from "devtools/client/debugger/src/selectors";
import { findClosestofSymbol } from "devtools/client/debugger/src/utils/ast";
import { getFilename } from "devtools/client/debugger/src/utils/source";
import { AnalysisInput, getFunctionBody } from "protocol/evaluation-utils";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/HitPointsCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { getBreakpointPositionsAsync } from "replay-next/src/suspense/SourcesCache";
import { compareExecutionPoints, isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
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
import { getSourceLinesAsync, getSymbolsAsync } from "ui/suspense/sourceCaches";

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
    const sourcesByUrl = getSourceIdsByUrl(getState());
    const allSources = getAllSourceDetails(getState());
    const sourcesState = getState().sources;
    const reactDomUrl = Object.keys(sourcesByUrl).find(key => {
      return key.includes("react-dom.");
    });

    if (!reactDomUrl) {
      // console.error("No ReactDOM url");
      return;
    }

    const reactDomSource = getSourceToDisplayForUrl(getState(), reactDomUrl);
    if (!reactDomSource || !reactDomSource.url) {
      // console.error("No preferred source");
      return;
    }
    // console.log("Getting symbols and positions");
    const [symbols, breakablePositionsResult] = await Promise.all([
      getSymbolsAsync(reactDomSource.id, allSources, replayClient),
      getBreakpointPositionsAsync(reactDomSource.id, replayClient),
    ]);

    if (!symbols) {
      return;
    }

    // console.log("Symbols: ", symbols);
    const [breakablePositions, breakablePositionsByLine] = breakablePositionsResult;

    let scheduleUpdateFiberDeclaration: AstPosition | undefined;
    let onCommitFiberRootDeclaration: AstPosition | undefined;

    if (reactDomSource.url!.includes(".development")) {
      const shouldUpdateFiberSymbol = symbols?.functions.find(
        f => f.name === "scheduleUpdateOnFiber"
      )!;
      const onCommitRootSymbol = symbols?.functions.find(f => f.name === "onCommitRoot")!;
      // console.log("onCommitRoot: ", onCommitRootSymbol);

      // console.log("shouldUpdateFiber: ", shouldUpdateFiberSymbol);
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

      const reactDomSourceLines = await getSourceLinesAsync(reactDomSource!.id, replayClient);

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
      // console.error("Could not find scheduleUpdate or onCommit");
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

    // console.log("Found positions: ", firstScheduleUpdateFiberPosition, firstOnCommitRootPosition);

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
    // console.log("Hit points: ", scheduleUpdateHitPoints);

    // TODO Arbitrary max of 200 points here. We need to figure out a better strategy.
    const scheduleUpdateHitPointsToCheck = scheduleUpdateHitPoints.slice(0, 200);
    const queuedRendersPromise = Promise.all(
      scheduleUpdateHitPointsToCheck.map(async (hitPoint): Promise<ReactQueuedRenderDetails> => {
        const pauseId = await getPauseIdAsync(replayClient, hitPoint.point, hitPoint.time);

        const pauseFrames = (await getPauseFramesAsync(replayClient, pauseId, sourcesState)) ?? [];
        const filteredPauseFrames = pauseFrames.filter(frame => {
          const { source } = frame;
          if (!source) {
            return false;
          }
          return !MORE_IGNORABLE_PARTIAL_URLS.some(partialUrl => source.url?.includes(partialUrl));
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
            // console.error("Error finding parent frame time: ", err);
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

    // console.log("Queued renders: ", queuedRenders);

    return {
      queuedRenders,
      committedRenders,
    };
  };
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

type CommonProps = {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
};

type QueuedRenderProps = CommonProps & {
  renderDetails: ReactQueuedRenderDetails;
};

function ReactQueuedRenderListItem({
  currentTime,
  renderDetails,
  executionPoint,
  onSeek,
}: QueuedRenderProps) {
  const dispatch = useAppDispatch();
  const { point, time } = renderDetails;
  const isPaused = time === currentTime && executionPoint === point;
  const [isHovered, setIsHovered] = useState(false);
  const cx = useAppSelector(getThreadContext);

  const [jumpToCodeStatus, setJumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const { userPauseFrame, userPauseFrameTime } = renderDetails;

  if (!userPauseFrame) {
    return null;
  }
  const { source } = userPauseFrame;

  const filename = source ? getFilename(source) : "Unknown";

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

  return (
    <>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon iconSize="xl">ads_click</MaterialIcon>
          <Label>
            {filename}: {userPauseFrame!.displayName}
          </Label>
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

type CommittedRenderProps = CommonProps & {
  commitPoint: TimeStampedPoint;
};

function ReactCommittedRenderListItem({
  currentTime,
  commitPoint,
  executionPoint,
  onSeek,
}: CommittedRenderProps) {
  const { point, time } = commitPoint;
  const isPaused = time === currentTime && executionPoint === point;

  const onClickSeek = () => {
    onSeek(point, time);
  };

  return (
    <>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <MaterialIcon iconSize="xl">check_circle_outline</MaterialIcon>
          <Label>React Render Committed</Label>
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

  const handleClick = async () => {
    console.log("Focus range: ", focusRange);
    const renderAnalysisResults = (await dispatch(findQueuedRendersForRange(focusRange!))) ?? null;
    setRenderDetails(renderAnalysisResults);
  };

  const onSeek = (point: string, time: number) => {
    // trackEvent("events_timeline.select");
    dispatch(seek(point, time, false));
  };

  const { queuedRenders = [], committedRenders = [] } = renderDetails ?? {};

  const allEntriesSorted: (ReactQueuedRenderDetails | TimeStampedPoint)[] = [
    ...queuedRenders,
    ...committedRenders,
  ];

  allEntriesSorted.sort((a, b) => compareExecutionPoints(a.point, b.point));

  const queuedRenderEntries = allEntriesSorted.map(entry => {
    if ("userPauseFrame" in entry) {
      return (
        <ReactQueuedRenderListItem
          currentTime={currentTime}
          executionPoint={executionPoint!}
          renderDetails={entry}
          onSeek={onSeek}
          key={entry.point}
        />
      );
    } else {
      return (
        <ReactCommittedRenderListItem
          currentTime={currentTime}
          executionPoint={executionPoint!}
          commitPoint={entry}
          onSeek={onSeek}
          key={entry.point}
        />
      );
    }
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        className="text-xl"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        React Renders <AccessibleImage className="annotation-logo react" />
      </div>
      <div>
        <button
          type="button"
          onClick={handleClick}
          className="mr-0 flex items-center space-x-1.5 rounded-lg bg-primaryAccent text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
          style={{ padding: "5px 12px" }}
        >
          Find React Renders
        </button>
      </div>
      <div style={{ flexGrow: 1, height: "100%" }}>
        <h3 className="text-lg">Renders In Range</h3>
        <div
          style={{ overflowY: "auto", display: "flex", flexDirection: "column", maxHeight: 725 }}
        >
          {queuedRenderEntries}
        </div>
      </div>
    </div>
  );
}

import {
  ExecutionPoint,
  FunctionMatch,
  Location,
  PointDescription,
  TimeStampedPoint,
} from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { createCache, useImperativeCacheValue } from "suspense";

import { PauseFrame } from "devtools/client/debugger/src/selectors";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegion } from "shared/utils/time";
import { UIThunkAction } from "ui/actions";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
import { seek } from "ui/actions/timeline";
import { SourcesState, getPreferredLocation } from "ui/reducers/sources";
import { getCurrentTime, getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";
import { getPauseFramesAsync } from "ui/suspense/frameCache";

import { JumpToCodeButton } from "../shared/JumpToCodeButton";
import { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const client = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const focusWindow = useAppSelector(getFocusWindow);
  const [searchValue, setSearchValue] = useState("");

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reduxDevToolsAnnotationsCache,
    client
  );
  const currentTime = useAppSelector(getCurrentTime);

  const reduxAnnotations: ReduxActionAnnotation[] = useMemo(() => {
    const annotations = annotationsStatus === "resolved" ? parsedAnnotations : [];
    return annotations.filter(
      annotation =>
        focusWindow &&
        isPointInRegion(annotation.point, focusWindow) &&
        annotation.payload.actionType.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [parsedAnnotations, annotationsStatus, focusWindow, searchValue]);

  const annotation = reduxAnnotations.find(ann => ann.point === selectedPoint)!;

  const firstAnnotationInTheFuture = reduxAnnotations.find(
    annotation => annotation.time >= currentTime
  );

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor text-xs", styles.actions)}>
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel collapsible>
          <ActionFilter searchValue={searchValue} onSearch={setSearchValue} />
          <div role="list" className={styles.list}>
            {reduxAnnotations.map(annotation => (
              <ActionItem
                key={annotation.point}
                annotation={annotation}
                selectedPoint={selectedPoint}
                setSelectedPoint={setSelectedPoint}
                firstAnnotationInTheFuture={firstAnnotationInTheFuture === annotation}
              />
            ))}
          </div>
        </ResizablePanel>
        <PanelResizeHandle className="h-full w-1 bg-chrome" />
        <ResizablePanel collapsible>
          {selectedPoint && annotation && (
            <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />
          )}
        </ResizablePanel>
      </PanelGroup>
    </div>
  );
};

function ActionFilter({
  searchValue,
  onSearch,
}: {
  searchValue: string;
  onSearch: (value: string) => void;
}) {
  return (
    <div className="inspector devtools-toolbar devtools-input-toolbar">
      <div
        id="redux-search"
        className={classnames(
          "devtools-searchbox grow text-themeTextFieldColor",
          styles.ActionFilter
        )}
      >
        <input
          id="redux-searchbox"
          className="devtools-searchinput"
          type="input"
          placeholder="Filter..."
          autoComplete="off"
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

async function isInsideApplyMiddlwareFn(
  replayClient: ReplayClientInterface,
  sourcesState: SourcesState,
  frame: PauseFrame
) {
  const dispatchMatches: FunctionMatch[] = [];

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

  const applyMiddlwareFunction = fileOutline.functions.find(o => o.name === "applyMiddleware")!;

  const { location, source } = frame;

  return (
    location.line >= applyMiddlwareFunction.location.begin.line &&
    location.line < applyMiddlwareFunction.location.end.line &&
    source?.url === reduxSource.url
  );
}

interface PointWithLocation {
  location: Location;
  point?: TimeStampedPoint;
}

const reduxDispatchJumpLocationCache = createCache<
  [
    replayClient: ReplayClientInterface,
    point: ExecutionPoint,
    time: number,
    sourcesState: SourcesState
  ],
  PointDescription | undefined
>({
  config: { immutable: true },
  debugLabel: "ReduxDispatchJumpLocation",
  getKey: ([replayClient, point, time, sourcesState]) => point,
  load: async ([replayClient, point, time, sourcesState]) => {
    const pauseId = await pauseIdCache.readAsync(replayClient, point, time);
    const frames = (await getPauseFramesAsync(replayClient, pauseId, sourcesState)) ?? [];
    const filteredPauseFrames = frames.filter(frame => {
      const { source } = frame;
      if (!source) {
        return false;
      }

      return !IGNORABLE_PARTIAL_SOURCE_URLS.some(partialUrl => source.url?.includes(partialUrl));
    });

    // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
    // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
    let preferredFrameIdx = 2;
    for (let frameIdx = 2; frameIdx < filteredPauseFrames.length; frameIdx++) {
      const frame = filteredPauseFrames[frameIdx];

      console.log("doing ", frameIdx);
      if (await isInsideApplyMiddlwareFn(replayClient, sourcesState, frame)) {
        // this is the frame inside `applyMiddleware` where the initial dispatch occurs
        // the frame just before this one is the user `dispatch`
        preferredFrameIdx = frameIdx + 1;
        break;
      }
    }

    const preferredFrame = filteredPauseFrames[preferredFrameIdx];
    const frameSteps = await frameStepsCache.readAsync(
      replayClient,
      pauseId,
      preferredFrame.protocolId
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

    const preferredLocation = getPreferredLocation(sourcesState, [preferredFrame.location]);

    // One of these locations should match up
    const matchingFrameStep: PointWithLocation | undefined = pointsWithLocations.find(step => {
      // Intentionally ignore columns for now - this seems to produce better results
      // that line up with the hit points in a print statement
      return (
        step.location.sourceId === preferredLocation.sourceId &&
        step.location.line === preferredLocation.line
      );
    });

    if (matchingFrameStep) {
      return matchingFrameStep.point;
    }
  },
});

function jumpToLocationForReduxDispatch(point: ExecutionPoint, time: number): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const sourcesState = getState().sources;
    const jumpLocation = await reduxDispatchJumpLocationCache.readAsync(
      replayClient,
      point,
      time,
      sourcesState
    );

    if (jumpLocation) {
      dispatch(seek(jumpLocation.point, jumpLocation.time, true));
    }
  };
}

function ActionItem({
  annotation,
  selectedPoint,
  setSelectedPoint,
  firstAnnotationInTheFuture,
}: {
  annotation: ReduxActionAnnotation;
  selectedPoint: ExecutionPoint | null;
  setSelectedPoint: (point: ExecutionPoint | null) => void;
  firstAnnotationInTheFuture: boolean;
}) {
  const dispatch = useAppDispatch();
  const onSeek = () => {
    dispatch(jumpToLocationForReduxDispatch(annotation.point, annotation.time));
  };

  return (
    <div
      key={annotation.point}
      className={classnames(styles.row, {
        [styles.selected]: annotation.point === selectedPoint,
        [styles.future]: firstAnnotationInTheFuture,
      })}
      role="listitem"
      onClick={() => setSelectedPoint(annotation.point)}
    >
      <JumpToCodeButton
        className={styles["jump-to-code"]}
        currentExecutionPoint={selectedPoint}
        targetExecutionPoint={annotation.point}
        status="found"
        onClick={onSeek}
      />
      <div className={styles.actionLabel}>{annotation.payload.actionType}</div>
    </div>
  );
}

export default ReduxDevToolsPanel;

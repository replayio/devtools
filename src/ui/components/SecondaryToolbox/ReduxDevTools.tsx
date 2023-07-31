import {
  ExecutionPoint,
  FunctionMatch,
  Location,
  PointDescription,
  SourceLocationRange,
} from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { createCache, createSingleEntryCache, useImperativeCacheValue } from "suspense";

import { PauseFrame } from "devtools/client/debugger/src/selectors";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import {
  sourcesByIdCache,
  streamingSourceContentsCache,
} from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext, replayClient } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegion } from "shared/utils/time";
import { UIThunkAction } from "ui/actions";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
import { findFunctionOutlineForLocation } from "ui/actions/eventListeners/jumpToCode";
import { seek } from "ui/actions/timeline";
import { SourcesState, getPreferredLocation } from "ui/reducers/sources";
import { getCurrentTime, getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";
import { getPauseFramesAsync } from "ui/suspense/frameCache";
import { getMatchingFrameStep } from "ui/utils/frame";

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
interface ApplyMiddlewareDecl {
  location: SourceLocationRange;
  sourceId: string;
}

const applyMiddlwareDeclCache = createSingleEntryCache<
  [replayClient: ReplayClientInterface, sourcesState: SourcesState],
  ApplyMiddlewareDecl
>({
  debugLabel: "ApplyMiddlwareDecl",
  load: async ([replayClient, sourcesState]) => {
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

    return {
      sourceId: reduxSource.sourceId,
      location: applyMiddlwareFunction.location,
    };
  },
});

function isFrameInDecl(decl: ApplyMiddlewareDecl, frame: PauseFrame) {
  return (
    frame.location.line >= decl.location.begin.line &&
    frame.location.line < decl.location.end.line &&
    frame.location.sourceId === decl.sourceId
  );
}

function isNestedInside(child: SourceLocationRange, parent: SourceLocationRange) {
  const startsBefore =
    parent.begin.line < child.begin.line ||
    (parent.begin.line === child.begin.line && parent.begin.column <= child.begin.column);
  const endsAfter =
    parent.end.line > child.end.line ||
    (parent.end.line === child.end.line && parent.end.column >= child.end.column);

  return startsBefore && endsAfter;
}

async function searchingCallstackForDispatch(
  pauseFrames: PauseFrame[],
  replayClient: ReplayClientInterface,
  sourcesState: SourcesState
) {
  // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
  // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
  let preferredFrameIdx = 2;
  const applyMiddlwareDecl = await applyMiddlwareDeclCache.readAsync(replayClient, sourcesState);

  for (let frameIdx = 2; frameIdx < pauseFrames.length; frameIdx++) {
    const frame = pauseFrames[frameIdx];

    if (isFrameInDecl(applyMiddlwareDecl, frame)) {
      // this is the frame inside `applyMiddleware` where the initial dispatch occurs
      // the frame just before this one is the user `dispatch`
      preferredFrameIdx = frameIdx + 1;
      return preferredFrameIdx;
    }
  }

  return null;
}

async function isReduxMiddleware(sourceContents: string, location: Location) {
  const sourceOutline = await sourceOutlineCache.readAsync(replayClient, location.sourceId);
  const dispatchFn = findFunctionOutlineForLocation(location, sourceOutline);
  const functions = sourceOutline.functions;

  if (dispatchFn && dispatchFn.parameters.length === 1) {
    const index = functions.indexOf(dispatchFn);
    if (index >= 2) {
      const wrapDispatchFn = functions[index - 1];
      const middlewareFn = functions[index - 2];

      if (
        wrapDispatchFn.parameters.length === 1 &&
        middlewareFn.parameters.length === 1 &&
        isNestedInside(dispatchFn.location, wrapDispatchFn.location) &&
        isNestedInside(wrapDispatchFn.location, middlewareFn.location)
      ) {
        return true;
      }
    }
  }

  return false;
}

async function searchSourceOutlineForDispatch(
  pauseFrames: PauseFrame[],
  replayClient: ReplayClientInterface
) {
  // The first 2 elements in filtered pause frames are from replay's redux stub, so they should be ignored
  // The 3rd element is the user function that calls it, and will most likely be the `dispatch` call
  let preferredFrameIdx = 2;
  let isMiddleware = true;

  while (isMiddleware && preferredFrameIdx < pauseFrames.length) {
    let preferredFrame = pauseFrames[preferredFrameIdx];

    const sourceContentsStream = streamingSourceContentsCache.stream(
      replayClient,
      preferredFrame.location.sourceId
    );

    await sourceContentsStream.resolver;

    if (sourceContentsStream.value) {
      if (await isReduxMiddleware(sourceContentsStream.value, preferredFrame.location)) {
        isMiddleware = true;
        preferredFrameIdx++;
      } else {
        isMiddleware = false;
      }
    }
  }

  return preferredFrameIdx;
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

    let preferredFrameIdx = await searchingCallstackForDispatch(
      filteredPauseFrames,
      replayClient,
      sourcesState
    );

    if (preferredFrameIdx === null) {
      // couldn't find the frame through the call stack
      // now try finding a function in the call stack
      // that matches (store => next => action => {})
      preferredFrameIdx = await searchSourceOutlineForDispatch(filteredPauseFrames, replayClient);
    }

    const preferredFrame = filteredPauseFrames[preferredFrameIdx];
    const preferredLocation = getPreferredLocation(sourcesState, [preferredFrame.location]);

    const matchingFrameStep = await getMatchingFrameStep(
      replayClient,
      preferredFrame,
      preferredLocation
    );

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

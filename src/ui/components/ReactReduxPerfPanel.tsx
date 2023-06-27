import { createSelector } from "@reduxjs/toolkit";
import {
  ExecutionPoint,
  FunctionMatch,
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
import { sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import { IGNORABLE_PARTIAL_SOURCE_URLS } from "ui/actions/eventListeners/eventListenerUtils";
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
import { getPauseFramesAsync } from "ui/suspense/frameCache";

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

function doSomeAnalysis(): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const sourcesState = getState().sources;
    const useSelectorMatches: FunctionMatch[] = [];
    console.log("Searching functions...");

    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    const reactReduxSources = Array.from(sourcesById.values()).filter(source =>
      source.url?.includes("react-redux")
    );

    console.log("React-Redux sources: ", reactReduxSources);

    await replayClient.searchFunctions(
      { query: "useSelector", sourceIds: reactReduxSources.map(source => source.id) },
      matches => {
        useSelectorMatches.push(...matches);
      }
    );
    console.log("Matches: ", useSelectorMatches);
    const [firstMatch] = useSelectorMatches;
    const preferredLocation = getPreferredLocation(sourcesState, [firstMatch.loc]);
    console.log("Preferred location: ", preferredLocation);
    const source = sourcesById.get(preferredLocation.sourceId);
    console.log("Source: ", source);
  };
}

export function ReactReduxPerfPanel() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const replayClient = useContext(ReplayClientContext);
  const { rangeForDisplay: focusRange } = useContext(FocusContext);

  const handleDoAnalysisClick = async () => {
    dispatch(doSomeAnalysis());
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

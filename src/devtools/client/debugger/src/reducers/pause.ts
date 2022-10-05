/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createSlice, createAsyncThunk, PayloadAction, AnyAction } from "@reduxjs/toolkit";
import type { Location, TimeStampedPoint, ScopeType, Value } from "@replayio/protocol";
import type { UIState } from "ui/state";
import { getPreferredLocation } from "ui/reducers/sources";

import { WiredNamedValue } from "protocol/thread/pause";
import { ThreadFront, ValueFront } from "protocol/thread";

import { getSelectedFrame, getFramePositions } from "../selectors/pause";
import findLast from "lodash/findLast";
import { compareNumericStrings } from "protocol/utils";
import { getSelectedSource, getSourceDetails, SourceDetails } from "ui/reducers/sources";

import { ThunkExtraArgs } from "ui/utils/thunk";
import { getContextFromAction } from "ui/setup/redux/middleware/context";
import { createFrame } from "devtools/client/debugger/src/client/create";

export interface Context {
  navigateCounter: number;
}

export interface ThreadContext {
  isPaused: boolean;
  navigateCounter: number;
  pauseCounter: number;
}

export interface PauseFrame {
  id: string;
  protocolId: string;
  asyncIndex: number;
  displayName: string;
  location: Location;
  alternateLocation?: Location;
  this: Value | ValueFront;
  source: SourceDetails | null;
  index: number;
  asyncCause?: "async";
  state: "on-stack";
  // Possibly added later client-side
  library?: string;
}

// TBD
type UnknownPosition = TimeStampedPoint & { location: Location };

interface ScopeDetails {
  pending: boolean;
  originalScopesUnavailable: boolean;
  scope?: ConvertedScope;
}

export interface PauseState {
  cx: { navigateCounter: number };
  id: string | undefined;
  threadcx: ThreadContext;
  pauseErrored: boolean;
  pauseLoading: boolean;
  pausePreviewLocation: Location | null;
  frames: PauseFrame[] | null;
  framesLoading: boolean;
  framesErrored: boolean;
  frameScopes: Record<string, ScopeDetails>;
  selectedFrameId: string | null;
  executionPoint: string | null;
  why: string | null;
  command: string | null;
  previousLocation: Location | null;
  replayFramePositions?: { positions: UnknownPosition[] } | null;
}

export type ValidCommand =
  | "stepIn"
  | "stepOut"
  | "stepOver"
  | "resume"
  | "rewind"
  | "reverseStepOver";

const resumedPauseState = {
  frames: null,
  framesLoading: false,
  framesErrored: false,
  frameScopes: {},
  selectedFrameId: null,
  executionPoint: null,
  why: null,
};

const initialState: PauseState = {
  pauseErrored: false,
  pauseLoading: false,
  cx: {
    navigateCounter: 0,
  },
  threadcx: {
    navigateCounter: 0,
    isPaused: false,
    pauseCounter: 0,
  },
  id: undefined,
  pausePreviewLocation: null,
  ...resumedPauseState,
  command: null,
  previousLocation: null,
};

export const executeCommandOperation = createAsyncThunk<
  { location: Location | null },
  { cx: Context; command: ValidCommand },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/executeCommand", async ({ cx, command }, thunkApi) => {
  const { extra, getState } = thunkApi;
  const { ThreadFront } = extra;
  const state = getState();
  const loadedRegions = getLoadedRegions(state)!;
  const nextPoint = getResumePoint(state, command)!;
  console.log("executeCommandOperation() nextPoint:", nextPoint);

  const resp = await ThreadFront[command](nextPoint, loadedRegions);
  if (!resp?.frame) {
    return { location: null };
  }

  const location = getPreferredLocation(
    state.sources,
    resp.frame,
    ThreadFront.preferredGeneratedSources
  );

  return { location };
});

// Isn't this a lovely type lookup?
type ProtocolScope = Awaited<ReturnType<typeof ThreadFront["getScopes"]>>["scopes"][number];

export interface ConvertedScope {
  actor: string;
  parent: ConvertedScope | null;
  bindings: WiredNamedValue[] | undefined;
  object: ValueFront | undefined;
  functionName: string | undefined;
  type: ScopeType;
  scopeKind: string;
}

function convertScope(protocolScope: ProtocolScope): ConvertedScope {
  const { scopeId, type, functionLexical, object, functionName, bindings } = protocolScope;

  return {
    actor: scopeId,
    parent: null,
    bindings,
    object,
    functionName,
    type,
    scopeKind: functionLexical ? "function lexical" : "",
  };
}

export const fetchScopes = createAsyncThunk<
  { scopes: ConvertedScope; originalScopesUnavailable: boolean; frameId: string },
  { cx: Context },
  { state: UIState; extra: ThunkExtraArgs }
>(
  "pause/fetchScopes",
  async (arg, thunkApi) => {
    const { extra, getState } = thunkApi;
    const { ThreadFront } = extra;

    const frame = getSelectedFrame(getState())!;

    const { scopes, originalScopesUnavailable } = await ThreadFront.getScopes(
      frame.asyncIndex,
      frame.protocolId
    );
    const converted = scopes.map(convertScope);
    for (let i = 0; i + 1 < converted.length; i++) {
      converted[i].parent = converted[i + 1];
    }
    return { scopes: converted[0], originalScopesUnavailable, frameId: frame.id };
  },
  {
    condition: (arg, { getState }) => {
      const frame = getSelectedFrame(getState());
      if (!frame || getFrameScope(getState(), frame.id)) {
        return false;
      }
    },
    dispatchConditionRejection: false,
  }
);

export const fetchFrames = createAsyncThunk<
  PauseFrame[],
  { cx: Context; pauseId: string },
  { state: UIState; extra: ThunkExtraArgs }
>("pause/fetchFrames", async ({ cx, pauseId }, thunkApi) => {
  const { ThreadFront } = thunkApi.extra;
  const frames = (await ThreadFront.getFrames()) ?? [];
  await ThreadFront.ensureAllSources();
  const state = thunkApi.getState();
  return frames.map((frame, i) =>
    createFrame(state.sources, ThreadFront.preferredGeneratedSources, frame, i)
  );
});

export const fetchAsyncFrames = createAsyncThunk<
  PauseFrame[],
  { cx: Context },
  { state: UIState; extra: ThunkExtraArgs }
>(
  "pause/fetchAsyncFrames",
  async ({ cx }, thunkApi) => {
    const { ThreadFront } = thunkApi.extra;
    await ThreadFront.ensureAllSources();
    const state = thunkApi.getState();
    let asyncFrames: PauseFrame[] = [];

    // How many times to fetch an async set of parent frames.
    const MAX_ASYNC_FRAME_GROUPS = 5;

    // We'll fetch up to 5 groups of async frames.
    // The existing group of sync frames are considered to be group 0,
    // so the first group of async frames is group 1.
    // These are used to generate frame IDs, such as `"2:3"` (third frame in group 2)
    for (let asyncIndex = 1; asyncIndex <= MAX_ASYNC_FRAME_GROUPS; asyncIndex++) {
      const frames = await ThreadFront.loadAsyncParentFrames();

      if (!frames.length) {
        break;
      }
      const pauseFrames = frames.map((frame, i) =>
        createFrame(state.sources, ThreadFront.preferredGeneratedSources, frame, i, asyncIndex)
      );

      asyncFrames = asyncFrames.concat(pauseFrames);
    }

    if (!asyncFrames.length) {
      // Skip dispatching an action, there's no data
      return thunkApi.rejectWithValue("No async frames");
    }

    return asyncFrames;
  },
  {
    dispatchConditionRejection: false,
  }
);

const pauseSlice = createSlice({
  name: "pause",
  initialState,
  reducers: {
    pauseRequestedAt(state) {
      Object.assign(state, {
        pauseErrored: false,
        pauseLoading: true,
        framesLoading: true,
        framesErrored: false,
      });

      state.threadcx.isPaused = true;
    },
    paused(
      state,
      action: PayloadAction<{
        id: string;
        frame?: PauseFrame;
        why?: string;
        executionPoint: string;
        // used by the legacy Messages reducer
        time?: number;
      }>
    ) {
      const { id, frame, why, executionPoint } = action.payload;
      Object.assign(state, {
        pauseErrored: false,
        pauseLoading: false,
        id,
        frameScopes: resumedPauseState.frameScopes,
        why,
        executionPoint,
      });

      state.selectedFrameId = frame ? frame.id : null;
      state.frames = frame ? [frame] : null;
      state.threadcx.pauseCounter++;
      state.pausePreviewLocation = null;
    },
    pauseCreationFailed(state, action: PayloadAction<string>) {
      const executionPoint = action.payload;
      Object.assign(state, {
        pauseErrored: true,
        pauseLoading: false,
        id: undefined,
        selectedFrameId: undefined,
        frames: undefined,
        frameScopes: {},
        executionPoint,
      });

      state.threadcx.pauseCounter++;
      state.threadcx.isPaused = false;
    },
    previewLocationUpdated(state, action: PayloadAction<Location>) {
      state.pausePreviewLocation = action.payload;
    },
    previewLocationCleared(state) {
      state.pausePreviewLocation = null;
    },
    framePositionsLoaded(state, action: PayloadAction<UnknownPosition[]>) {
      state.replayFramePositions = { positions: action.payload };
    },
    framePositionsCleared(state) {
      state.replayFramePositions = null;
    },
    frameSelected(state, action: PayloadAction<{ cx: Context; frameId: string }>) {
      state.selectedFrameId = action.payload.frameId;
    },
    resumed(state) {
      Object.assign(state, resumedPauseState);
      state.threadcx.isPaused = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(executeCommandOperation.pending, (state, action) => {
        const { command } = action.meta.arg;
        state.command = command;
        state.threadcx.pauseCounter++;
        state.threadcx.isPaused = false;
        state.previousLocation = getPauseLocation(state as PauseState, command);

        if (command == "resume" || command == "rewind") {
          // TODO This logic seems at odds with the existing
          // "fetch if no positions" in the `command` thunk
          // also clear out positions
          state.replayFramePositions = null;
        }
      })
      .addCase(executeCommandOperation.fulfilled, (state, action) => {
        state.command = null;
        state.pausePreviewLocation = action.payload.location;
      })
      .addCase(executeCommandOperation.rejected, (state, action) => {
        state.command = null;
      })
      .addCase(fetchFrames.fulfilled, (state, action) => {
        const frames = action.payload;
        // Keep Immer from recursing into `ValueFront`s
        Object.freeze(frames);
        const selectedFrameId = frames[0]?.id;
        state.frames = frames;
        state.selectedFrameId = selectedFrameId;
        state.framesLoading = false;
        state.framesErrored = false;
      })
      .addCase(fetchFrames.rejected, state => {
        state.frames = null;
        state.selectedFrameId = null;
        state.framesLoading = false;
        state.framesErrored = true;
      })
      .addCase(fetchAsyncFrames.fulfilled, (state, action) => {
        const existingFrames = state.frames ?? [];
        state.frames = existingFrames.concat(action.payload);
      })
      .addCase(fetchScopes.pending, (state, action) => {
        const { selectedFrameId } = state;
        state.frameScopes[selectedFrameId!] = {
          pending: true,
          originalScopesUnavailable: true,
          scope: undefined,
        };
      })
      .addCase(fetchScopes.fulfilled, (state, action) => {
        const { frameId, ...scopesFields } = action.payload;

        // Keep Immer from recursing into `ValueFront`s
        if (scopesFields?.scopes) {
          Object.freeze(scopesFields.scopes);
        }

        state.frameScopes[frameId] = {
          pending: false,
          originalScopesUnavailable: !!scopesFields.originalScopesUnavailable,
          scope: scopesFields.scopes,
        };
      });
  },
});

export const {
  framePositionsCleared,
  framePositionsLoaded,
  frameSelected,
  pauseCreationFailed,
  pauseRequestedAt,
  paused,
  previewLocationCleared,
  previewLocationUpdated,
  resumed,
} = pauseSlice.actions;

// Copied to avoid import
const getLoadedRegions = (state: UIState) => state.app.loadedRegions;

function getPauseLocation(state: PauseState, command: string) {
  const { frames, previousLocation } = state;

  // NOTE: We store the previous location so that we ensure that we
  // do not stop at the same location twice when we step over.
  if (command !== "stepOver") {
    return null;
  }

  const frame = frames && frames[0];
  if (!frame) {
    return previousLocation;
  }

  return frame.location;
}

// Selectors

export function getContext(state: UIState) {
  return state.pause.cx;
}

export function getThreadContext(state: UIState) {
  return state.pause.threadcx;
}

export function getPauseReason(state: UIState) {
  return state.pause.why;
}

export function getPauseCommand(state: UIState) {
  return state.pause.command;
}

export function isStepping(state: UIState) {
  return ["stepIn", "stepOver", "stepOut"].includes(getPauseCommand(state)!);
}

export function getIsPaused(state: UIState) {
  return !!state.pause.frames;
}

export function hasFrames(state: UIState) {
  return !!getTopFrame(state);
}

export function getPreviousPauseFrameLocation(state: UIState) {
  return state.pause.previousLocation;
}

export function isEvaluatingExpression(state: UIState) {
  return state.pause.command === "expression";
}

export function getFrames(state: UIState) {
  const f = state.pause.frames;
  const { frames, framesLoading } = state.pause;
  return framesLoading ? null : frames;
}

export function getFramesLoading(state: UIState) {
  return state.pause.framesLoading;
}

export function getFramesErrored(state: UIState) {
  return state.pause.framesErrored;
}

export function getFrameScope(state: UIState, frameId?: string) {
  if (!frameId) {
    return null;
  }

  const { frameScopes } = state.pause;
  return frameScopes[frameId];
}

export function getSelectedScope(state: UIState) {
  const frameId = getSelectedFrameId(state)!;
  const frameScopes = getFrameScope(state, frameId);
  return frameScopes && frameScopes.scope;
}

export function getSelectedFrameId(state: UIState) {
  return state.pause.selectedFrameId;
}

export function getTopFrame(state: UIState) {
  const frames = getFrames(state);
  return frames && frames[0];
}

export function isTopFrame(state: UIState) {
  const topFrame = getTopFrame(state);
  const selectedFrame = getSelectedFrame(state);
  return topFrame == selectedFrame;
}

export function getExecutionPoint(state: UIState) {
  return state.pause.executionPoint;
}

export function getPauseId(state: UIState) {
  return state.pause.id;
}

export function getPausePreviewLocation(state: UIState) {
  return state.pause.pausePreviewLocation;
}

export function getResumePoint(state: UIState, type: string) {
  const framePoints = getFramePositions(state)?.positions.map(p => p.point);
  const executionPoint = getExecutionPoint(state);

  if (!framePoints || isTopFrame(state)) {
    return null;
  }

  if (type == "reverseStepOver" || type == "rewind") {
    return findLast(framePoints, p => compareNumericStrings(p, executionPoint!) < 0);
  }

  if (type == "stepOver" || type == "resume" || type == "stepIn" || type == "stepUp") {
    return framePoints.find(p => compareNumericStrings(p, executionPoint!) > 0);
  }
}

// TODO Move these to `ui/reducers/sources`

// Get the ID of any alternate source that can be switched to from selectedSource.
// This only works when the debugger is paused somewhere, and we have an
// alternate location for the location of the selected frame.
function getAlternateSourceId(state: UIState, selectedSource: SourceDetails) {
  if (!selectedSource) {
    return null;
  }
  const frames = getFrames(state);
  if (!frames) {
    return null;
  }
  const selectedFrameId = getSelectedFrameId(state);
  const selectedFrame = frames.find(f => f.id == selectedFrameId);

  if (!selectedFrame || selectedFrame.location.sourceId != selectedSource.id) {
    return null;
  }
  const { alternateLocation } = selectedFrame;
  return alternateLocation ? alternateLocation.sourceId : null;
}

export function getAlternateSource(state: UIState) {
  const selectedSource = getSelectedSource(state);
  const alternateSourceId = getAlternateSourceId(state, selectedSource!);

  if (!alternateSourceId) {
    return null;
  }

  return getSourceDetails(state, alternateSourceId);
}

const pauseWrapperReducer = (state: PauseState, action: AnyAction) => {
  const cx = getContextFromAction(action);
  // Ignore actions if the pause counter is different, which indicates
  // that the user did something else before a response returned
  if (cx && cx.pauseCounter !== state.threadcx.pauseCounter) {
    return state;
  }
  return pauseSlice.reducer(state, action);
};

export default pauseWrapperReducer;

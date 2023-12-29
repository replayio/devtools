// Side-effectful import - needed to initialize these prefs
import { EntityState, PayloadAction, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { BoxModel } from "@replayio/protocol";

import { pauseRequestedAt } from "devtools/client/debugger/src/reducers/pause";
import { UIState } from "ui/state";

export interface MarkupState {
  highlightedNodes: string[] | null;
  nodeBoxModels: EntityState<BoxModel>;
  selectedNode: string | null;
}

const boxModelAdapter = createEntityAdapter<BoxModel>({
  selectId: boxModel => boxModel.node,
});

export const { selectById: getNodeBoxModelById } = boxModelAdapter.getSelectors(
  (state: UIState) => state.markup.nodeBoxModels
);

const initialState: MarkupState = {
  highlightedNodes: null,
  nodeBoxModels: boxModelAdapter.getInitialState(),
  selectedNode: null,
};

const markupSlice = createSlice({
  name: "markup",
  initialState,
  reducers: {
    resetMarkup() {
      return initialState;
    },
    nodeSelected: {
      reducer(state, action: PayloadAction<{ nodeId: string | null }>) {
        const { nodeId } = action.payload;
        state.selectedNode = nodeId;
      },
      prepare(nodeId: string | null) {
        return {
          payload: { nodeId },
        };
      },
    },
    nodesHighlighted(state, action: PayloadAction<string[]>) {
      const uniqueNodeIds = [...new Set(action.payload)];
      state.highlightedNodes = uniqueNodeIds;
    },
    nodeBoxModelsLoaded(state, action: PayloadAction<BoxModel[]>) {
      boxModelAdapter.setAll(state.nodeBoxModels, action);
    },
    nodeHighlightingCleared(state) {
      state.highlightedNodes = null;
    },
  },
  extraReducers: builder => {
    // dispatched by actions/timeline.ts, in `playback()`
    builder.addCase(pauseRequestedAt, () => {
      // We need to reset this whenever the timeline is paused,
      // and do so as early in the pause processing sequence as possible
      // (before the UI really starts rendering).
      // This will avoid mismatches in fetching node data.
      return initialState;
    });
    builder.addCase("pause/resumed", (state, action) => {
      // Clear out the DOM nodes data whenever the user hits "Play" in the timeline.
      // However, preserve whatever nodes may be highlighted at the time,
      // since these can now be independent of the current pause (such as
      // highlighting from a test step)
      return {
        ...initialState,
        highlightedNodes: state.highlightedNodes,
        nodeBoxModels: state.nodeBoxModels,
      };
    });
  },
});

export const {
  resetMarkup,
  nodeSelected,
  nodesHighlighted,
  nodeBoxModelsLoaded,
  nodeHighlightingCleared,
} = markupSlice.actions;

export default markupSlice.reducer;

export const getSelectedDomNodeId = (state: UIState) => state.markup.selectedNode;

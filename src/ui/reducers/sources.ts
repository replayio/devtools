import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { newSource, SourceKind } from "@replayio/protocol";
import { getSelectedSourceId } from "devtools/client/debugger/src/selectors";
import { UIState } from "ui/state";
import { newSourcesToCompleteSourceDetails } from "ui/utils/sources";

export interface SourceDetails {
  canonicalId: string;
  correspondingSourceIds: string[];
  generated: string[];
  generatedFrom: string[];
  id: string;
  kind: SourceKind;
  contentHash?: string;
  prettyPrinted?: string;
  prettyPrintedFrom?: string;
  url?: string;
}

const sourceDetailsAdapter = createEntityAdapter<SourceDetails>();
const sourcesAdapter = createEntityAdapter<newSource>({ selectId: source => source.sourceId });
const sourceSelectors = sourcesAdapter.getSelectors();

export interface SourcesState {
  sourceDetails: EntityState<SourceDetails>;
  sources: EntityState<newSource>;
}

const initialState: SourcesState = {
  sourceDetails: sourceDetailsAdapter.getInitialState(),
  sources: sourcesAdapter.getInitialState(),
};

const sourcesSlice = createSlice({
  name: "sources",
  initialState,
  reducers: {
    addSources: (state, action: PayloadAction<newSource[]>) => {
      // Store the raw protocol information. Once we have recieved all sources
      // we will iterate over this and build it into the shape we want.
      sourcesAdapter.addMany(state.sources, action.payload);
    },
    allSourcesReceived: state => {
      sourceDetailsAdapter.addMany(
        state.sourceDetails,
        newSourcesToCompleteSourceDetails(sourceSelectors.selectAll(state.sources))
      );
    },
  },
});

const sourceDetailsSelectors = sourceDetailsAdapter.getSelectors<UIState>(
  (state: UIState) => state.experimentalSources.sourceDetails
);

export const getSourceDetails = sourceDetailsSelectors.selectById;
export const getAllSourceDetails = sourceDetailsSelectors.selectAll;
export const getSelectedSourceDetails = (state: UIState) => {
  const selected = getSelectedSourceId(state);
  if (!selected) {
    return undefined;
  }

  return sourceDetailsSelectors.selectById(state, selected);
};
export const getCorrespondingSourceIds = (state: UIState, id: string) =>
  getSourceDetails(state, id)?.correspondingSourceIds;

export const { addSources, allSourcesReceived } = sourcesSlice.actions;

export default sourcesSlice.reducer;

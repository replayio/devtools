import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "ui/state";

interface Blackboxed {
  id: string;
  blackboxed: boolean;
}

export type BlackboxedState = EntityState<Blackboxed>;

const blackboxedAdapter = createEntityAdapter<Blackboxed>();
const initialState = blackboxedAdapter.getInitialState();

const blackboxedSlice = createSlice({
  name: "blackboxed",
  initialState,
  reducers: {
    blackboxSource: (state, action: PayloadAction<string>) => {
      blackboxedAdapter.upsertOne(state, {
        id: action.payload,
        blackboxed: true,
      });
    },
    unblackboxSource: (state, action: PayloadAction<string>) => {
      blackboxedAdapter.upsertOne(state, {
        id: action.payload,
        blackboxed: false,
      });
    },
  },
});

export const { blackboxSource, unblackboxSource } = blackboxedSlice.actions;
const { selectById } = blackboxedAdapter.getSelectors<UIState>(s => s.blackboxed);

export const getIsBlackboxed = (state: UIState, id: string): Boolean => {
  return Boolean(selectById(state, id)?.blackboxed);
};

export default blackboxedSlice.reducer;

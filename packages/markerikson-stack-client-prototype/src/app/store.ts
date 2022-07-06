import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";

import { api } from "./api";
import selectedSourcesReducer from "../features/sources/selectedSourcesSlice";
import sourceDetailsReducer from "../features/sources/sourceDetailsSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      selectedSources: selectedSourcesReducer,
      sourceDetails: sourceDetailsReducer,
    },
    middleware: gDM => gDM().concat(api.middleware),
  });
}

const store = makeStore();

export type AppStore = typeof store;
export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>;

export default store;

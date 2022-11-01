import { Action, ThunkAction, configureStore } from "@reduxjs/toolkit";

import selectedSourcesReducer from "../features/sources/selectedSourcesSlice";
import sourcesReducer from "../features/sources/sourcesSlice";
import { api } from "./api";

export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      selectedSources: selectedSourcesReducer,
      sources: sourcesReducer,
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

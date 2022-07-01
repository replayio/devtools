// eslint-disable-next-line no-restricted-imports
import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, AppState, AppStore } from "./store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppStore: () => AppStore = useStore;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

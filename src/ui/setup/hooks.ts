// We ban use of `useDispatch/useSelector` in the codebase in favor of the typed hooks,
// but this is the one file that needs them
// eslint-disable-next-line no-restricted-imports
import { useDispatch, useSelector, useStore } from "react-redux";

import type { UIState } from "ui/state";

import type { AppDispatch, AppStore } from "./store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppStore = useStore.withTypes<AppStore>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<UIState>();

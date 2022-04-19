import { createContext } from "react";

import type { Actions, State } from "./useConsoleSearch";

// Storing state and dispatch in separate contexts allows parts of the tree to access the (state) dispatch function
// without re-rendering when the state value changes.
export const ActionsContext = createContext<Actions>(null as any);
export const StateContext = createContext<State>(null as any);

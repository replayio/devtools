import { createContext } from "react";

import type { Actions, State } from "./hooks/useConsoleSearch";

export const SearchContext = createContext<[State, Actions]>(null as any);

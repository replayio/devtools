import { createContext } from "react";

import type { Actions, State } from "./hooks/useConsoleSearchDOM";

export const SearchContext = createContext<[State, Actions]>(null as any);

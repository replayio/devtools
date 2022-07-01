import { createContext } from "react";

export const FilterContext = createContext<FilterContextType>(null as any);
type FilterContextType = {
  filter: string;
  displayedString: string;
  setAppliedText: (str: string) => void;
  setDisplayedText: (str: string) => void;
};

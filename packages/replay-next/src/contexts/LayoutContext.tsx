import { createContext } from "react";

export type LayoutContextType = {
  // whether console and sources can be shown at the same time
  canShowConsoleAndSources: boolean;
};

export const LayoutContext = createContext<LayoutContextType>({
  canShowConsoleAndSources: true,
});

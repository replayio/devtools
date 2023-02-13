import React, { PropsWithChildren, useMemo } from "react";

import { LayoutContext, LayoutContextType } from "replay-next/src/contexts/LayoutContext";
import { getToolboxLayout } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";

export default function LayoutContextAdapter({ children }: PropsWithChildren) {
  const layout = useAppSelector(getToolboxLayout);

  const context = useMemo<LayoutContextType>(
    () => ({
      canShowConsoleAndSources: layout === "ide",
    }),
    [layout]
  );

  return <LayoutContext.Provider value={context}>{children}</LayoutContext.Provider>;
}

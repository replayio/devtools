import { PropsWithChildren, useContext, useMemo } from "react";
import { useImperativeCacheValue } from "suspense";

import { LayoutContext, LayoutContextType } from "replay-next/src/contexts/LayoutContext";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getToolboxLayout } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";

export default function LayoutContextAdapter({ children }: PropsWithChildren) {
  const replayClient = useContext(ReplayClientContext);

  const layout = useAppSelector(getToolboxLayout);

  const { value: recordingCapabilities } = useImperativeCacheValue(
    recordingCapabilitiesCache,
    replayClient
  );

  const context = useMemo<LayoutContextType>(() => {
    let canShowConsoleAndSources = false;
    if (recordingCapabilities) {
      if (recordingCapabilities.supportsRepaintingGraphics) {
        canShowConsoleAndSources = layout === "ide";
      } else {
        canShowConsoleAndSources = layout === "left";
      }
    }

    return { canShowConsoleAndSources };
  }, [layout, recordingCapabilities]);

  return <LayoutContext.Provider value={context}>{children}</LayoutContext.Provider>;
}

import { FrameId, PauseId } from "@replayio/protocol";
import { createContext, PropsWithChildren, Suspense, useContext, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import useLoadedRegions from "../hooks/useRegions";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { TimelineContext } from "./TimelineContext";
import { isPointInRegions } from "shared/utils/time";
import { getPauseForExecutionPointSuspense } from "../suspense/PauseCache";

interface PauseAndFrameId {
  pauseId: PauseId;
  frameId: FrameId;
}

export interface SelectedFrameContextType {
  selectedPauseAndFrameId: PauseAndFrameId | null;
  setSelectedPauseAndFrameId(pauseAndFrameId: PauseAndFrameId | null): void;
}

export const SelectedFrameContext = createContext<SelectedFrameContextType>({
  selectedPauseAndFrameId: null,
  setSelectedPauseAndFrameId: () => {},
});

export function SelectedFrameContextRoot({ children }: PropsWithChildren<{}>) {
  const [selectedPauseAndFrameId, setSelectedPauseAndFrameId] = useState<PauseAndFrameId | null>(
    null
  );
  const context = useMemo(
    () => ({ selectedPauseAndFrameId, setSelectedPauseAndFrameId }),
    [selectedPauseAndFrameId, setSelectedPauseAndFrameId]
  );
  return <SelectedFrameContext.Provider value={context}>{children}</SelectedFrameContext.Provider>;
}

function SelectedFrameContextAdapter() {
  const client = useContext(ReplayClientContext);
  const loadedRegions = useLoadedRegions(client);
  const { executionPoint } = useContext(TimelineContext);
  const { selectedPauseAndFrameId, setSelectedPauseAndFrameId } = useContext(SelectedFrameContext);

  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);

  const pause = isLoaded ? getPauseForExecutionPointSuspense(client, executionPoint) : undefined;

  const pauseId = pause?.pauseId;
  const frameId = pause?.stack?.[0] ?? null;

  const pauseAndFrameId = pauseId && frameId ? { pauseId, frameId } : null;
  if (!isEqual(pauseAndFrameId, selectedPauseAndFrameId)) {
    setSelectedPauseAndFrameId(pauseAndFrameId);
  }

  return null;
}

export default function SelectedFrameContextWrapper({ children }: PropsWithChildren<{}>) {
  return (
    <SelectedFrameContextRoot>
      <Suspense>
        <SelectedFrameContextAdapter />
      </Suspense>
      {children}
    </SelectedFrameContextRoot>
  );
}

import { FrameId, PauseId } from "@replayio/protocol";
import isEqual from "lodash/isEqual";
import {
  ComponentType,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  Suspense,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegions } from "shared/utils/time";

import useLoadedRegions from "../hooks/useRegions";
import { getPauseForExecutionPointHelper } from "../suspense/PauseCache";
import { TimelineContext } from "./TimelineContext";

interface PauseAndFrameId {
  pauseId: PauseId;
  frameId: FrameId;
}

export interface SelectedFrameContextType {
  selectedPauseAndFrameId: PauseAndFrameId | null;
  setSelectedPauseAndFrameId: Dispatch<SetStateAction<PauseAndFrameId | null>>;
}

export const SelectedFrameContext = createContext<SelectedFrameContextType>({
  selectedPauseAndFrameId: null,
  setSelectedPauseAndFrameId: () => {},
});

export function SelectedFrameContextRoot({
  children,
  SelectedFrameContextAdapter = DefaultSelectedFrameContextAdapter,
}: PropsWithChildren & {
  SelectedFrameContextAdapter?: ComponentType;
}) {
  const [selectedPauseAndFrameId, setSelectedPauseAndFrameId] = useState<PauseAndFrameId | null>(
    null
  );
  const context = useMemo(
    () => ({
      selectedPauseAndFrameId,
      setSelectedPauseAndFrameId,
    }),
    [selectedPauseAndFrameId, setSelectedPauseAndFrameId]
  );

  return (
    <SelectedFrameContext.Provider value={context}>
      <Suspense>
        <SelectedFrameContextAdapter />
      </Suspense>
      {children}
    </SelectedFrameContext.Provider>
  );
}

function DefaultSelectedFrameContextAdapter() {
  const client = useContext(ReplayClientContext);
  const loadedRegions = useLoadedRegions(client);
  const { executionPoint } = useContext(TimelineContext);
  const { setSelectedPauseAndFrameId } = useContext(SelectedFrameContext);

  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);

  useLayoutEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    async function getData() {
      const pause = await getPauseForExecutionPointHelper(client, executionPoint);

      // Edge case handle an update that rendered while we were awaiting data.
      // In the case we should skip any state update.
      if (cancelled) {
        return;
      }

      // TODO
      // Select the top frame by default because the test harness doesn't have a Call Stack UI yet.
      const pauseId = pause.pauseId;
      const frameId = pause.stack?.[0] ?? null;

      const pauseAndFrameId = frameId ? { pauseId, frameId } : null;
      setSelectedPauseAndFrameId(prevPauseAndFrameId => {
        // We create a new pause-and-frame-id wrapper object each time we update,
        // so use deep comparison to avoid scheduling unnecessary/no-op state updates.
        return isEqual(pauseAndFrameId, prevPauseAndFrameId)
          ? prevPauseAndFrameId
          : pauseAndFrameId;
      });
    }

    getData();

    return () => {
      cancelled = true;
    };
  }, [client, executionPoint, isLoaded, setSelectedPauseAndFrameId]);

  return null;
}

import { ExecutionPoint, Location, PauseId } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { pauseIdCache } from "../suspense/PauseCache";

export type TimelineContextType = {
  executionPoint: ExecutionPoint | null;
  isPending: boolean;
  pauseId: PauseId | null;
  time: number;
  update: (
    time: number,
    executionPoint: ExecutionPoint,
    openSource: boolean,
    location?: Location
  ) => void;
};

export const TimelineContext = createContext<TimelineContextType>(null as any);

export function TimelineContextRoot({ children }: PropsWithChildren<{}>) {
  const client = useContext(ReplayClientContext);
  const [executionPoint, setExecutionPoint] = useState<ExecutionPoint>("0");
  const [pauseId, setPauseId] = useState<PauseId | null>(null);
  const [time, setTime] = useState<number>(0);

  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (time: number, executionPoint: ExecutionPoint) => {
      // Components might suspend in response to the this changing.
      startTransition(() => {
        setExecutionPoint(executionPoint);
        setTime(time);
        setPauseId(null);
      });
      async function updatePauseId() {
        const pauseId = await pauseIdCache.readAsync(client, executionPoint, time);
        startTransition(() => setPauseId(pauseId));
      }
      updatePauseId();
    },
    [client]
  );

  const context = useMemo(
    () => ({ executionPoint, isPending, pauseId, update, time }),
    [executionPoint, isPending, pauseId, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

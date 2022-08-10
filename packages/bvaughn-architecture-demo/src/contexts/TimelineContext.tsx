import { ExecutionPoint, PauseId } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type TimelineContextType = {
  executionPoint: ExecutionPoint;
  isPending: boolean;
  pauseId: PauseId | null;
  time: number;
  update: (time: number, executionPoint: ExecutionPoint, pauseId: PauseId) => void;
};

export const TimelineContext = createContext<TimelineContextType>(null as any);

export function TimelineContextRoot({ children }: PropsWithChildren<{}>) {
  const [executionPoint, setExecutionPoint] = useState<ExecutionPoint>("0");
  const [pauseId, setPauseId] = useState<PauseId | null>(null);
  const [time, setTime] = useState<number>(0);

  const [isPending, startTransition] = useTransition();

  const update = useCallback((time: number, executionPoint: ExecutionPoint, pauseId: PauseId) => {
    // Components might suspend in response to the this changing.
    startTransition(() => {
      setExecutionPoint(executionPoint);
      setPauseId(pauseId);
      setTime(time);
    });
  }, []);

  const context = useMemo(
    () => ({ executionPoint, isPending, pauseId, update, time }),
    [executionPoint, isPending, pauseId, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

import { ExecutionPoint } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type TimelineContextType = {
  executionPoint: ExecutionPoint | null;
  isPending: boolean;
  time: number | null;
  update: (time: number, executionPoint: ExecutionPoint) => void;
};

export const TimelineContext = createContext<TimelineContextType>(null as any);

export function TimelineContextRoot({ children }: PropsWithChildren<{}>) {
  const [executionPoint, setExecutionPoint] = useState<ExecutionPoint | null>(null);
  const [time, setTime] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const update = useCallback((time: number, executionPoint: ExecutionPoint) => {
    // Components might suspend in response to the this changing.
    // TODO Do we need this?
    // startTransition(() => {
    setExecutionPoint(executionPoint);
    setTime(time);
    // });
  }, []);

  const context = useMemo(
    () => ({ executionPoint, isPending, update, time }),
    [executionPoint, isPending, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

import { ExecutionPoint, Location } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type TimelineContextType = {
  executionPoint: ExecutionPoint | null;
  isPending: boolean;
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
  const [executionPoint, setExecutionPoint] = useState<ExecutionPoint>("0");
  const [time, setTime] = useState<number>(0);

  const [isPending, startTransition] = useTransition();

  const update = useCallback((time: number, executionPoint: ExecutionPoint) => {
    // Components might suspend in response to the this changing.
    startTransition(() => {
      setExecutionPoint(executionPoint);
      setTime(time);
    });
  }, []);

  const context = useMemo(
    () => ({ executionPoint, isPending, update, time }),
    [executionPoint, isPending, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

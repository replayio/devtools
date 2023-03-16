import { ExecutionPoint, PauseId } from "@replayio/protocol";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { TimelineContext, TimelineContextType } from "replay-next/src/contexts/TimelineContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek } from "ui/actions/timeline";
import { getCurrentPoint } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
export default function TimelineContextAdapter({ children }: PropsWithChildren) {
  const client = useContext(ReplayClientContext);
  const [state, setState] = useState<Omit<TimelineContextType, "isPending" | "update">>({
    executionPoint: "0",
    time: 0,
  });

  const [isPending, startTransition] = useTransition();

  const dispatch = useAppDispatch();
  const time = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getCurrentPoint) || "0";

  const update = useCallback(
    async (time: number, executionPoint: ExecutionPoint, openSource: boolean) => {
      dispatch(seek(executionPoint, time, openSource));
    },
    [dispatch]
  );

  useLayoutEffect(() => {
    startTransition(() => {
      setState({ executionPoint, time });
    });
  }, [executionPoint, time]);

  const context = useMemo<TimelineContextType>(
    () => ({
      ...state,
      isPending,
      update,
    }),
    [isPending, state, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

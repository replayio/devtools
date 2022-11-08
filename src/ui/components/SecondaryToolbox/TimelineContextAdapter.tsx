import { ExecutionPoint, PauseId } from "@replayio/protocol";
import React, {
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  TimelineContext,
  TimelineContextType,
} from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { getPauseIdForExecutionPointIfCached } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { Pause, ThreadFront } from "protocol/thread";
import { seek } from "ui/actions/timeline";
import { getCurrentPoint } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
export default function TimelineContextAdapter({ children }: PropsWithChildren) {
  const [state, setState] = useState<Omit<TimelineContextType, "isPending" | "update">>({
    executionPoint: "0",
    time: 0,
  });

  const [isPending, startTransition] = useTransition();

  const dispatch = useAppDispatch();
  const time = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getCurrentPoint) || "0";

  const update = useCallback(
    async (time: number, executionPoint: ExecutionPoint) => {
      let pauseId: PauseId | null = null;

      // Pre-cache Pause data (required by legacy app code) before calling seek().
      // The new Console doesn't load this data but the old one requires it.
      const cachedPauseId = getPauseIdForExecutionPointIfCached(executionPoint)?.value;
      if (cachedPauseId != null) {
        pauseId = cachedPauseId;

        const cachedPause = Pause.getById(cachedPauseId);
        if (!cachedPause) {
          const newPause = new Pause(ThreadFront);
          newPause.instantiate(cachedPauseId, executionPoint, time, false);
          await newPause.ensureLoaded();
        }
      } else {
        const pause = new Pause(ThreadFront);
        pause.create(executionPoint, time);
        await pause.ensureLoaded();

        pauseId = pause.pauseId;
      }

      dispatch(seek(executionPoint, time, false /* hasFrames */, pauseId!));
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

import { ExecutionPoint, Location } from "@replayio/protocol";
import React, { PropsWithChildren, useCallback, useMemo } from "react";

import { getExecutionPoint, getPauseId, getTime } from "devtools/client/debugger/src/selectors";
import { TimelineContext, TimelineContextType } from "replay-next/src/contexts/TimelineContext";
import { seek } from "ui/actions/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
export default function TimelineContextAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const time = useAppSelector(getTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const pauseId = useAppSelector(getPauseId) ?? null;

  const update = useCallback(
    async (
      time: number,
      executionPoint: ExecutionPoint,
      openSource: boolean,
      location?: Location
    ) => {
      dispatch(seek({ executionPoint, time, openSource, location }));
    },
    [dispatch]
  );

  const context = useMemo<TimelineContextType>(
    () => ({
      executionPoint,
      pauseId,
      time,
      isPending: false,
      update,
    }),
    [executionPoint, pauseId, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

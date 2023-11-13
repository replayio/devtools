import { ExecutionPoint, Location } from "@replayio/protocol";
import React, { PropsWithChildren, useCallback, useMemo } from "react";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import { TimelineContext, TimelineContextType } from "replay-next/src/contexts/TimelineContext";
import { seek } from "ui/actions/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
export default function TimelineContextAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const time = useAppSelector(getTime);
  const executionPoint = useAppSelector(getExecutionPoint);

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
      time,
      isPending: false,
      update,
    }),
    [executionPoint, time, update]
  );

  return <TimelineContext.Provider value={context}>{children}</TimelineContext.Provider>;
}

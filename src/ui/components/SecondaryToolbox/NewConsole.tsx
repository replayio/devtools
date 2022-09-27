import { ExecutionPoint, PauseId } from "@replayio/protocol";
import NewConsole from "bvaughn-architecture-demo/components/console";
import { SearchContext } from "bvaughn-architecture-demo/components/console/SearchContext";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import {
  Point,
  PointId,
  PointsContext,
} from "bvaughn-architecture-demo/src/contexts/PointsContext";
import {
  NewTerminalExpression,
  TerminalContext,
  TerminalExpression,
} from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import {
  TimelineContext,
  TimelineContextType,
} from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import React, {
  KeyboardEvent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { getCachedPauseIdForExecutionPoint } from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { Range } from "bvaughn-architecture-demo/src/types";
import { setBreakpointPrefixBadge } from "devtools/client/debugger/src/actions/breakpoints";
import {
  getLogPointsList,
  getPauseId,
  getSelectedFrame,
} from "devtools/client/debugger/src/selectors";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import JSTerm from "devtools/client/webconsole/components/Input/JSTerm";
import { Pause, ThreadFront } from "protocol/thread";
import { seek, setFocusRegion } from "ui/actions/timeline";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getCurrentPoint, getLoadedRegions } from "ui/reducers/app";
import { getCurrentTime, getFocusRegion, getRecordingDuration } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { FocusRegion } from "ui/state/timeline";
import { rangeForFocusRegion } from "ui/utils/timeline";

import styles from "./NewConsole.module.css";
import { ConsoleNag } from "../shared/Nags/Nags";
import useTerminalHistory from "./useTerminalHistory";

// Adapter that connects the legacy app Redux stores to the newer React Context providers.
export default function NewConsoleRoot() {
  const recordingId = useGetRecordingId();

  const duration = useAppSelector(getRecordingDuration)!;

  const sessionContext = useMemo<SessionContextType>(
    () => ({
      accessToken: ThreadFront.getAccessToken(),
      recordingId,
      sessionId: ThreadFront.sessionId!,

      // Duration info is primarily used by the focus editor (not imported yet)
      // but Console message context menu also allows refining the focus, which uses it.
      duration,
      endPoint: null as any,

      // Current user info is only used by the new Comments UI (which isn't included yet)
      currentUserInfo: null as any,
    }),
    [duration, recordingId]
  );

  return (
    <SessionContext.Provider value={sessionContext}>
      <TimelineContextAdapter>
        <InspectorContextReduxAdapter>
          <TerminalContextController>
            <FocusContextReduxAdapter>
              <PointsContextReduxAdapter>
                <NewConsole
                  nagHeader={<ConsoleNag />}
                  showSearchInputByDefault={false}
                  terminalInput={<JSTermWrapper />}
                />
              </PointsContextReduxAdapter>
            </FocusContextReduxAdapter>
          </TerminalContextController>
        </InspectorContextReduxAdapter>
      </TimelineContextAdapter>
    </SessionContext.Provider>
  );
}

function JSTermWrapper() {
  const [_, searchActions] = useContext(SearchContext);
  const { addMessage } = useContext(TerminalContext);

  const recordingId = useGetRecordingId();
  const [terminalExpressionHistory, setTerminalExpressionHistory] = useTerminalHistory(recordingId);

  // Note that the "frameId" the protocol expects is actually the "protocolId" and NOT the "frameId"
  const frame = useAppSelector(getSelectedFrame);
  const frameId = frame?.protocolId || null;

  const pauseId = useAppSelector(getPauseId);
  const point = useAppSelector(getCurrentPoint);
  const time = useAppSelector(getCurrentTime);

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        searchActions.hide();

        event.preventDefault();
        event.stopPropagation();
        break;
      case "f":
      case "F":
        if (event.metaKey) {
          searchActions.show();

          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  };

  const addTerminalExpression = (expression: string) => {
    if (pauseId == null || point == null) {
      return;
    }

    setTerminalExpressionHistory(expression);

    addMessage({
      expression,
      frameId: frameId || null,
      pauseId,
      point,
      time,
    });
  };

  return (
    <div className={styles.JSTermWrapper} onKeyDown={onKeyDown} data-test-id="JSTerm">
      <JSTerm
        addTerminalExpression={addTerminalExpression}
        terminalExpressionHistory={terminalExpressionHistory}
      />
    </div>
  );
}

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const loadedRegions = useAppSelector(getLoadedRegions);
  const focusRegion = useAppSelector(getFocusRegion);

  const [isPending, startTransition] = useTransition();
  const [deferredFocusRegion, setDeferredFocusRegion] = useState<FocusRegion | null>(null);

  useEffect(() => {
    startTransition(() => {
      setDeferredFocusRegion(focusRegion);
    });
  }, [focusRegion, loadedRegions]);

  const update = useCallback(
    (value: Range | null, _: boolean) => {
      dispatch(
        setFocusRegion(
          value !== null
            ? {
                beginTime: value[0],
                endTime: value[1],
              }
            : null
        )
      );
    },
    [dispatch]
  );

  const context = useMemo(() => {
    return {
      isTransitionPending: isPending,
      range: deferredFocusRegion ? rangeForFocusRegion(deferredFocusRegion) : null,
      rangeForDisplay: focusRegion ? rangeForFocusRegion(focusRegion) : null,
      update,
    };
  }, [deferredFocusRegion, isPending, focusRegion, update]);

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}

// Adapter that reads log points (from Redux) and passes them to the PointsContext.
function PointsContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();

  const logpoints = useAppSelector(getLogPointsList);

  // Convert to the Point[] format required by the new Console.
  const points = useMemo<Point[]>(
    () =>
      logpoints.map(logpoint => ({
        badge: logpoint.options.prefixBadge || null,
        condition: logpoint.options.condition || null,
        content: logpoint.options.logValue!,
        enableBreaking: false,
        enableLogging: true,
        id: logpoint.id,
        location: logpoint.location,
      })),
    [logpoints]
  );

  const [isPending, startTransition] = useTransition();
  const [deferredPoints, setDeferredPoints] = useState<Point[]>([]);

  // Update derived analysis points in a transition (so it's safe to Suspend) when points change.
  useEffect(() => {
    startTransition(() => {
      setDeferredPoints(points);
    });
  }, [points]);

  // Limited edit functionality for this context: setting logpoint badge.
  const editPoint = useCallback(
    (id: PointId, partialPoint: Partial<Point>) => {
      const { badge, ...rest } = partialPoint;
      if (badge !== undefined && Object.keys(rest).length === 0) {
        const breakpoint = logpoints.find(logpoint => logpoint.id === id);
        if (breakpoint) {
          dispatch(setBreakpointPrefixBadge(breakpoint, badge || undefined));
        }
      }
    },
    [dispatch, logpoints]
  );

  const context = useMemo(
    () => ({
      isPending,
      points,
      pointsForAnalysis: deferredPoints,

      // PointsContext is read-only in this context.
      // Log points are added by the legacy source Editor component.
      addPoint: () => {},
      deletePoint: () => {},
      editPoint,
    }),
    [deferredPoints, editPoint, isPending, points]
  );

  return <PointsContext.Provider value={context}>{children}</PointsContext.Provider>;
}

function TerminalContextController({ children }: PropsWithChildren) {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<TerminalExpression[]>([]);

  const idCounterRef = useRef(0);

  const addMessage = useCallback((partialTerminalExpression: NewTerminalExpression) => {
    // New expressions should be added in a transition because they suspend.
    startTransition(() => {
      startTransition(() => {
        setMessages(prev => [
          ...prev,
          {
            ...partialTerminalExpression,
            id: idCounterRef.current++,
            type: "TerminalExpression",
          },
        ]);
      });
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const terminalContext = useMemo(
    () => ({
      addMessage,
      clearMessages,
      isPending,
      messages,
    }),
    [addMessage, clearMessages, isPending, messages]
  );

  return <TerminalContext.Provider value={terminalContext}>{children}</TerminalContext.Provider>;
}

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
function TimelineContextAdapter({ children }: PropsWithChildren) {
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
      const cachedPauseId = getCachedPauseIdForExecutionPoint(executionPoint);
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

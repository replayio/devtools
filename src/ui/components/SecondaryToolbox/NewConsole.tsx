import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import NewConsole from "bvaughn-architecture-demo/components/console";
import { SearchContext } from "bvaughn-architecture-demo/components/console/SearchContext";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import {
  Point,
  PointId,
  PointsContext,
} from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { TerminalContext, TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import {
  TimelineContext,
  TimelineContextType,
} from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import React, {
  KeyboardEvent,
  PropsWithChildren,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  SessionContext,
  SessionContextType,
} from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { Range } from "bvaughn-architecture-demo/src/types";
import { getLogPointsList, getPauseId } from "devtools/client/debugger/src/selectors";
import {
  messagesClearEvaluations,
  onViewSourceInDebugger,
  openNodeInInspector,
} from "devtools/client/webconsole/actions";
import { EvaluationEventPayload } from "devtools/client/webconsole/actions/input";
import JSTerm from "devtools/client/webconsole/components/Input/JSTerm";
import { Pause, ThreadFront, ValueFront } from "protocol/thread";
import { seek, setFocusRegion } from "ui/actions/timeline";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getCurrentPoint, getLoadedRegions } from "ui/reducers/app";
import { getCurrentTime, getFocusRegion, getRecordingDuration } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { FocusRegion } from "ui/state/timeline";
import { displayedBeginForFocusRegion, displayedEndForFocusRegion } from "ui/utils/timeline";

import ReplayLogo from "../shared/ReplayLogo";

import styles from "./NewConsole.module.css";
import { setBreakpointPrefixBadge } from "devtools/client/debugger/src/actions/breakpoints";

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
    <Suspense fallback={<Loader />}>
      <SessionContext.Provider value={sessionContext}>
        <TimelineContextAdapter>
          <InspectorContextReduxAdapter>
            <TerminalContextReduxAdapter>
              <FocusContextReduxAdapter>
                <PointsContextReduxAdapter>
                  <NewConsole showSearchInputByDefault={false} terminalInput={<JSTermWrapper />} />
                </PointsContextReduxAdapter>
              </FocusContextReduxAdapter>
            </TerminalContextReduxAdapter>
          </InspectorContextReduxAdapter>
        </TimelineContextAdapter>
      </SessionContext.Provider>
    </Suspense>
  );
}

function JSTermWrapper() {
  const [_, searchActions] = useContext(SearchContext);

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

  return (
    <div className={styles.JSTermWrapper} onKeyDown={onKeyDown}>
      <JSTerm />
    </div>
  );
}

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const loadedRegions = useAppSelector(getLoadedRegions);
  const focusRegion = useAppSelector(getFocusRegion);

  console.log("Focus", focusRegion, loadedRegions);

  const [isPending, startTransition] = useTransition();
  const [deferredFocusRegion, setDeferredFocusRegion] = useState<FocusRegion | null>(null);

  useEffect(() => {
    startTransition(() => {
      setDeferredFocusRegion(focusRegion);
    });
  }, [focusRegion, loadedRegions]);

  const update = useCallback(
    (value: Range | null, debounce: boolean) => {
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

  const context = useMemo(
    () => ({
      isTransitionPending: isPending,
      range: focusRegionToRange(deferredFocusRegion),
      rangeForDisplay: focusRegionToRange(focusRegion),
      update,
    }),
    [deferredFocusRegion, isPending, focusRegion, update]
  );

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}

// Adapter that connects inspect-function and inspect-html-element actions with Redux.
function InspectorContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();

  const inspectFunctionDefinition = useCallback(
    (mappedLocation: MappedLocation) => {
      const location = mappedLocation.length > 0 ? mappedLocation[mappedLocation.length - 1] : null;
      if (location) {
        const url = ThreadFront.getSourceURLRaw(location.sourceId);
        if (url) {
          dispatch(
            onViewSourceInDebugger({
              url,
              line: location.line,
              column: location.column,
            })
          );
        }
      }
    },
    [dispatch]
  );

  // TODO (FE-337) Make this function work, then pass it down through the context.
  const inspectHTMLElement = useCallback(
    (
      protocolValue: ProtocolValue,
      pauseId: PauseId,
      executionPoint: ExecutionPoint,
      time: number
    ) => {
      (async () => {
        if (pauseId) {
          let pause = Pause.getById(pauseId);
          if (!pause) {
            // Pre-cache Pause data (required by legacy app code) before calling seek().
            // The new Console doesn't load this data but the old one requires it.
            pause = new Pause(ThreadFront);
            pause.instantiate(pauseId, executionPoint, time, false);
            await pause.ensureLoaded();
          }

          if (pause) {
            // The new Console does not use ValueFronts; it uses Suspense to load preview data.
            // Legacy Devtools expects ValueFronts (with loaded previews) though, so we need to do the conversion here.
            // Be sure to clone the protocol value data first, because ValueFront deeply mutates the object it's passed,
            // which includes changing its structure in ways that breaks the new Console.
            const clonedValue = JSON.parse(JSON.stringify(protocolValue));
            const valueFront = new ValueFront(pause, clonedValue);
            await valueFront.loadIfNecessary();

            // The node inspector expects the node and all of its parents to have been loaded.
            // Since the new Console doesn't use ValueFronts, we have to manually load them here.
            let objectId = clonedValue.object;
            while (objectId) {
              const object = await pause.getObjectPreview(clonedValue.object);
              const valueFront = new ValueFront(pause, object);
              await valueFront.loadIfNecessary();

              objectId = object.preview?.node?.parentNode;
            }

            dispatch(openNodeInInspector(valueFront));
          }
        }
      })();
    },
    [dispatch]
  );

  const context = useMemo(
    () => ({ inspectFunctionDefinition, inspectHTMLElement: null }),
    [inspectFunctionDefinition]
  );

  return <InspectorContext.Provider value={context}>{children}</InspectorContext.Provider>;
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
        condition: null, // TODO
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

// Adapter that reads console evaluations (from Redux) and passes them to the TerminalContext.
function TerminalContextReduxAdapter({ children }: PropsWithChildren) {
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<TerminalExpression[]>([]);

  const dispatch = useAppDispatch();

  const clearMessages = useCallback(() => {
    dispatch(messagesClearEvaluations);
    setMessages([]);
  }, [dispatch]);

  // Update derived terminal expressions in a transition (so it's safe to Suspend) when they change.
  useEffect(() => {
    const onEvaluation = (data: EvaluationEventPayload) => {
      startTransition(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            ...data,
            type: "TerminalExpression",
          },
        ]);
      });
    };

    ThreadFront.on("evaluation", onEvaluation);
    return () => {
      ThreadFront.off("evaluation", onEvaluation);
    };
  }, []);

  const context = useMemo(
    () => ({
      clearMessages,
      isPending,
      messages: messages,

      // New terminal expressions can only be added via JSTerm (and Redux) in this context.
      addMessage: () => {},
    }),
    [clearMessages, isPending, messages]
  );

  return <TerminalContext.Provider value={context}>{children}</TerminalContext.Provider>;
}

// Adapter that reads the current execution point and time (from Redux) and passes them to the TimelineContext.
function TimelineContextAdapter({ children }: PropsWithChildren) {
  const [state, setState] = useState<Omit<TimelineContextType, "isPending" | "update">>({
    executionPoint: "0",
    pauseId: null,
    time: 0,
  });

  const [isPending, startTransition] = useTransition();

  const dispatch = useAppDispatch();
  const pauseId = useAppSelector(getPauseId);
  const time = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getCurrentPoint) || "0";

  const update = useCallback(
    async (time: number, executionPoint: ExecutionPoint, pauseId: PauseId) => {
      if (!Pause.getById(pauseId)) {
        // Pre-cache Pause data (required by legacy app code) before calling seek().
        // The new Console doesn't load this data but the old one requires it.
        const pause = new Pause(ThreadFront);
        pause.instantiate(pauseId, executionPoint, time, false);
        await pause.ensureLoaded();
      }

      dispatch(seek(executionPoint, time, false /* hasFrames */, pauseId));
    },
    [dispatch]
  );

  useLayoutEffect(() => {
    if (pauseId) {
      startTransition(() => {
        setState({ executionPoint, time, pauseId });
      });
    }
  }, [executionPoint, pauseId, time]);

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

function focusRegionToRange(focusRegion: FocusRegion | null): Range | null {
  if (focusRegion === null) {
    return null;
  }

  return [displayedBeginForFocusRegion(focusRegion), displayedEndForFocusRegion(focusRegion)];
}

function Loader() {
  return (
    <div className={styles.Loader}>
      <ReplayLogo size="md" color="gray" />
    </div>
  );
}

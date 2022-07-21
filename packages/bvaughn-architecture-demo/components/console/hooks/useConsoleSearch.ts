import { Loggable, LoggablesContext } from "@bvaughn/components/console/LoggablesContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import type { Actions as SearchActions, State as SearchState } from "@bvaughn/src/hooks/useSearch";
import { isEventLog, isPointInstance } from "@bvaughn/src/utils/console";
import useSearch from "@bvaughn/src/hooks/useSearch";
import { getCachedAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import { useContext, useMemo, useState } from "react";

const EMPTY_ARRAY: any[] = [];

function search(query: string, loggables: Loggable[]): Loggable[] {
  const results: Loggable[] = [];

  const needle = query.toLocaleLowerCase();
  loggables.forEach(loggable => {
    if (isEventLog(loggable)) {
      loggable.values.some(value => {
        // TODO Search non-primitive values (nested values) as well.
        // Probably easier if we convert from ProtocolValue to ClientValue first.
        if (typeof value === "string") {
          if ((value as string).toLocaleLowerCase().includes(needle)) {
            results.push(loggable);
            return true;
          }
        } else if (typeof value?.value === "string") {
          if (value?.value?.toLowerCase()?.includes(needle)) {
            results.push(loggable);
            return true;
          }
        }
        return false;
      });
    } else if (isPointInstance(loggable)) {
      const logPointInstance = loggable as PointInstance;
      const analysis = getCachedAnalysis(
        logPointInstance.point.location,
        logPointInstance.timeStampedHitPoint,
        logPointInstance.point.content
      );
      analysis?.values?.some(value => {
        // TODO Search non-primitive values (nested values) as well.
        // Probably easier if we convert from ProtocolValue to ClientValue first.
        if (typeof value === "string") {
          if ((value as string).toLocaleLowerCase().includes(needle)) {
            results.push(loggable);
            return true;
          }
        } else if (typeof value?.value === "string") {
          if (value?.value?.toLowerCase()?.includes(needle)) {
            results.push(loggable);
            return true;
          }
        }
        return false;
      });
    } else {
      const protocolMessage = loggable as ProtocolMessage;
      if (
        typeof protocolMessage.text === "string" &&
        protocolMessage.text.toLocaleLowerCase().includes(needle)
      ) {
        results.push(loggable);
      } else {
        protocolMessage.argumentValues?.some((argumentValue: ProtocolValue) => {
          // TODO Search non-primitive values (nested values) as well.
          // Probably easier if we convert from ProtocolValue to ClientValue first.
          if (typeof argumentValue.value === "string") {
            if (argumentValue.value.toLocaleLowerCase().includes(needle)) {
              results.push(loggable);
              return true;
            }
          }
          return false;
        });
      }
    }
  });

  return results;
}

export type Actions = SearchActions & {
  hide: () => void;
  show: () => void;
};

export type State = SearchState<Loggable> & {
  visible: boolean;
};

const INVISIBLE_STATE: State = {
  results: EMPTY_ARRAY,
  index: -1,
  query: "",
  visible: false,
};

export default function useConsoleSearch(): [State, Actions] {
  const loggables = useContext(LoggablesContext);

  const [state, dispatch] = useSearch<Loggable>(loggables, search);
  const [visible, setVisible] = useState<boolean>(true);

  const externalActions = useMemo(
    () => ({
      ...dispatch,
      hide: () => setVisible(false),
      show: () => setVisible(true),
    }),
    [dispatch]
  );

  const externalState = useMemo(
    () =>
      visible
        ? {
            ...state,
            visible,
          }
        : INVISIBLE_STATE,
    [state, visible]
  );

  return [externalState, externalActions];
}

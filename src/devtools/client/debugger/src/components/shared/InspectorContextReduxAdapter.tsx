import {
  ExecutionPoint,
  MappedLocation,
  PauseId,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";
import React, { ReactNode, useCallback, useMemo } from "react";
import { onViewSourceInDebugger, openNodeInInspector } from "devtools/client/webconsole/actions";
import { Pause, ThreadFront, ValueFront } from "protocol/thread";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { setSelectedPrimaryPanel } from "ui/actions/layout";

// Adapter that connects inspect-function and inspect-html-element actions with Redux.
export default function InspectorContextReduxAdapter({ children }: { children: ReactNode }) {
  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const dispatch = useAppDispatch();

  const inspectFunctionDefinition = useCallback(
    (mappedLocation: MappedLocation) => {
      const location = mappedLocation.length > 0 ? mappedLocation[mappedLocation.length - 1] : null;
      if (location) {
        const url = sourcesById[location.sourceId]?.url;
        if (url) {
          dispatch(
            onViewSourceInDebugger({
              url,
              sourceId: location.sourceId,
              line: location.line,
              column: location.column,
            })
          );
        }
      }
    },
    [sourcesById, dispatch]
  );

  const showCommentsPanel = useCallback(() => {
    dispatch(setSelectedPrimaryPanel("comments"));
  }, [dispatch]);

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
    () => ({ inspectFunctionDefinition, inspectHTMLElement: null, showCommentsPanel }),
    [inspectFunctionDefinition, showCommentsPanel]
  );

  return <InspectorContext.Provider value={context}>{children}</InspectorContext.Provider>;
}

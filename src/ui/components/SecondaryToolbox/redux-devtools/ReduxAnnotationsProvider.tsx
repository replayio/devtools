import { Annotation } from "@replayio/protocol";
import React, { useEffect, useRef, useState } from "react";

import { ThreadFront } from "protocol/thread";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";

import { ReduxAnnotationsContext, processReduxAnnotations } from "./redux-annotations";
import type { ReduxActionAnnotation } from "./redux-annotations";

interface RAPProps {
  children?: React.ReactNode;
}

const fetchedAnnotations: Annotation[] = [
  {
    point: "5841333965870490996444469078786217",
    time: 3912,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "8112963841484235038054569073442992",
    time: 5300,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "9735556609780795890548039468712121",
    time: 6467,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/increment","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "12331705039059159000342538859053263",
    time: 7864,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/decrement","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
  {
    point: "14603334914677673831138701986496738",
    time: 9252,
    kind: "redux-devtools-data",
    contents:
      '{"event":"action","payload":{"actionType":"counter/incrementByAmount","shouldIgnoreAction":false,"connectionType":"redux","instanceId":1}}',
  },
];

export const ReduxAnnotationsProvider = ({ children }: RAPProps) => {
  const [annotations, setAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const dispatch = useAppDispatch();
  const isStrictEffectsSecondRenderRef = useRef(false);

  useEffect(() => {
    // TODO Re-enable Redux DevTools annotations handling

    if (ThreadFront.recordingId !== "1ff386de-f3b4-4ff1-a5a3-8c137387b620") {
      return;
    }

    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current) {
      return;
    }

    isStrictEffectsSecondRenderRef.current = true;

    if (fetchedAnnotations.length) {
      // Pre-process Redux annotations by parsing the string messages,
      // then add them to the state array and pass down via context.
      setAnnotations(prevAnnotations =>
        prevAnnotations.concat(processReduxAnnotations(fetchedAnnotations))
      );
    }
  }, [dispatch]);

  return (
    <ReduxAnnotationsContext.Provider value={annotations}>
      {children}
    </ReduxAnnotationsContext.Provider>
  );
};

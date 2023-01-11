import { Annotation } from "@replayio/protocol";
import React, { useEffect, useRef, useState } from "react";

import { ThreadFront } from "protocol/thread";
import { useFeature } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";

import {
  ReduxAnnotationsContext,
  exampleReduxAnnotations,
  processReduxAnnotations,
} from "./redux-annotations";
import type { ReduxActionAnnotation } from "./redux-annotations";

interface RAPProps {
  children?: React.ReactNode;
}

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

    if (exampleReduxAnnotations.length) {
      // Pre-process Redux annotations by parsing the string messages,
      // then add them to the state array and pass down via context.
      setAnnotations(prevAnnotations =>
        prevAnnotations.concat(processReduxAnnotations(exampleReduxAnnotations))
      );
    }
  }, [dispatch]);

  return (
    <ReduxAnnotationsContext.Provider value={annotations}>
      {children}
    </ReduxAnnotationsContext.Provider>
  );
};

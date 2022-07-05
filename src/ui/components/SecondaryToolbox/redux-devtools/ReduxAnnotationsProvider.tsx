import { ThreadFront } from "protocol/thread";
import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { useFeature } from "ui/hooks/settings";

import { ReduxAnnotationsContext, processReduxAnnotations } from "./redux-annotations";
import type { ReduxActionAnnotation } from "./redux-annotations";

interface RAPProps {
  children?: React.ReactNode;
}

export const ReduxAnnotationsProvider = ({ children }: RAPProps) => {
  const [annotations, setAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const dispatch = useAppDispatch();
  const isStrictEffectsSecondRenderRef = useRef(false);

  useEffect(() => {
    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current) {
      return;
    }

    isStrictEffectsSecondRenderRef.current = true;

    ThreadFront.getAnnotations(annotations => {
      if (annotations.length) {
        // Pre-process Redux annotations by parsing the string messages,
        // then add them to the state array and pass down via context.
        setAnnotations(prevAnnotations =>
          prevAnnotations.concat(processReduxAnnotations(annotations))
        );
      }
    }, "redux-devtools-bridge");
  }, [dispatch]);

  return (
    <ReduxAnnotationsContext.Provider value={annotations}>
      {children}
    </ReduxAnnotationsContext.Provider>
  );
};

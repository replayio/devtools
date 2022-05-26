import { ThreadFront } from "protocol/thread";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "ui/hooks/settings";

import { ReduxAnnotationsContext, processReduxAnnotations } from "./redux-annotations";
import type { ReduxActionAnnotation } from "./redux-annotations";

interface RAPProps {
  children?: React.ReactNode;
}

export const ReduxAnnotationsProvider = ({ children }: RAPProps) => {
  const [annotations, setAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const dispatch = useDispatch();
  const isStrictEffectsSecondRenderRef = useRef(false);
  const { value: reduxDevtoolsEnabled } = useFeature("showRedux");

  useEffect(() => {
    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current || !reduxDevtoolsEnabled) {
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
  }, [reduxDevtoolsEnabled, dispatch]);

  return (
    <ReduxAnnotationsContext.Provider value={annotations}>
      {children}
    </ReduxAnnotationsContext.Provider>
  );
};

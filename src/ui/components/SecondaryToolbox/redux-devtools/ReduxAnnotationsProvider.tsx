import { ThreadFront } from "protocol/thread";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { addAnnotations } from "ui/actions/reactDevTools";

import { ReduxAnnotationsContext, processReduxAnnotations } from "./redux-annotations";
import type { ReduxActionAnnotation } from "./redux-annotations";

interface RAPProps {
  children?: React.ReactNode;
}

export const ReduxAnnotationsProvider = ({ children }: RAPProps) => {
  const [annotations, setAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const dispatch = useDispatch();
  const isStrictEffectsSecondRenderRef = useRef(false);

  useEffect(() => {
    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current) {
      return;
    }

    isStrictEffectsSecondRenderRef.current = true;

    ThreadFront.getAnnotations(({ annotations }) => {
      // TODO We're also getting some other annotations here.
      // It would be nice if we could ask the backend to filter them for us.
      const reactDevtoolsAnnotations = annotations.filter(annotation => {
        // `kind` value per React Devtools code in `gecko-dev`
        return annotation.kind === "react-devtools-bridge";
      });

      const reduxDevtoolsAnnotations = annotations.filter(annotation => {
        // `kind` value per Redux Devtools code in `gecko-dev`
        const isReduxAnnotation = annotation.kind === "redux-devtools-bridge";
        return isReduxAnnotation;
      });

      if (reduxDevtoolsAnnotations.length) {
        // Pre-process Redux annotations by parsing the string messages,
        // then add them to the state array and pass down via context.
        const newReduxActionAnnotations = processReduxAnnotations(reduxDevtoolsAnnotations);
        setAnnotations(prevAnnotations => prevAnnotations.concat(newReduxActionAnnotations));
      }

      // React annotations get kept in the Redux store for now.
      dispatch(
        // TODO This action should be named more specific to the React usage
        addAnnotations(
          reactDevtoolsAnnotations.map(({ point, time, contents }) => ({
            point,
            time,
            message: JSON.parse(contents),
          }))
        )
      );
    });
  }, [dispatch]);

  return (
    <ReduxAnnotationsContext.Provider value={annotations}>
      {children}
    </ReduxAnnotationsContext.Provider>
  );
};

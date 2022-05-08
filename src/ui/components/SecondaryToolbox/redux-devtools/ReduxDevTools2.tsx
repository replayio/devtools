import type ReduxDevToolsStore from "@redux-devtools/app/lib/cjs/store/configureStore";
import React, { useLayoutEffect, useState, useContext } from "react";
import { batch, Provider } from "react-redux";
import ActionsList from "./ActionsList
import { ReduxAnnotationsContext } from "./redux-annotations
import configureStore from "@redux-devtools/app/lib/cjs/store/configureStore";

export const ReduxDevToolsPanel = () => {
  const [reduxDevToolsStore, setStore] = useState<typeof ReduxDevToolsStore | null>(null);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);

  // Configure Redux DevTools store
  useLayoutEffect(() => {
    bootstrapReduxDevTools()  
  }, []);

  useLayoutEffect(() => {
    if (reduxAnnotations) {
      // bootstrapStoreWithAnnotations(reduxAnnotations)
    }
  }, [ reduxAnnotations]);

  return (
    <div>
      <ReduxDevToolsHeader />
      <div>
      <ActionsList /> 
      <ActionSummary />
      </div>
    </div>
  );
};

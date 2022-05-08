import type ReduxDevToolsStore from "@redux-devtools/app/lib/cjs/store/configureStore";
import React, { useLayoutEffect, useState, useContext } from "react";
import { useSelector, batch, Provider } from "react-redux";
import ActionsList from "./redux-devtools/ActionsList";
import { ReduxAnnotationsContext } from "./redux-devtools/redux-annotations";
import configureStore from "@redux-devtools/app/lib/cjs/store/configureStore";

export const ReduxDevToolsPanel = () => {
  const [reduxDevToolsStore, setStore] = useState<typeof ReduxDevToolsStore | null>(null);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);

  // Configure Redux DevTools store
  useLayoutEffect(() => {
    const { store } = configureStore(store => {
      if (store.getState().connection.type !== "disabled") {
        store.dispatch({
          type: "socket/CONNECT_REQUEST",
        });
      }
    });
    console.log("str", store);
    window.rtStore = store;
    setStore(() => store);
  }, []);

  useLayoutEffect(() => {
    if (!reduxDevToolsStore) {
      return;
    }

    // Add Redux DevTools annotations to the store
    batch(() => {
      reduxDevToolsStore.dispatch({
        type: "devTools/UPDATE_STATE",
        request: {
          type: "LIFTED",
          id: "default",
        },
      });

      reduxAnnotations.forEach(annotation => reduxDevToolsStore.dispatch(annotation.action));
    });
  }, [reduxDevToolsStore, reduxAnnotations]);

  if (!reduxDevToolsStore) {
    return <div>Loading...</div>;
  }

  return (
    <Provider store={reduxDevToolsStore}>
      <ActionsList />
    </Provider>
  );
};

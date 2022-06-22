import type { AppProps } from "next/app";
import { useMemo } from "react";
import { Provider } from "react-redux";
import createReplayClient from "shared/client/createReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import store from "../app/store";
import Initializer from "../components/Initializer";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  const replayClient = useMemo(createReplayClient, []);

  return (
    <ReplayClientContext.Provider value={replayClient}>
      <Provider store={store}>
        <Initializer>
          <Component {...pageProps} />
        </Initializer>
      </Provider>
    </ReplayClientContext.Provider>
  );
}

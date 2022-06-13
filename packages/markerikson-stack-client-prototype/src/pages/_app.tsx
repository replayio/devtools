import "../styles/globals.css";

import { Provider } from "react-redux";
import type { AppProps } from "next/app";

import Initializer from "../components/Initializer";

import store from "../app/store";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Initializer>
        <Component {...pageProps} />
      </Initializer>
    </Provider>
  );
}

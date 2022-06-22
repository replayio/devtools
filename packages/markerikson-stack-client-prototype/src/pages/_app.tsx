import type { AppProps } from "next/app";
import { Provider } from "react-redux";

import store from "../app/store";
import Initializer from "../components/Initializer";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Initializer>
        <Component {...pageProps} />
      </Initializer>
    </Provider>
  );
}

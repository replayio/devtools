import { ApolloProvider } from "@apollo/client";
import { Store } from "@reduxjs/toolkit";
import type { AppContext, AppProps } from "next/app";
import NextApp from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { memo, useEffect, useState } from "react";
import { Provider } from "react-redux";

import { SystemProvider } from "design";
import { replayClient } from "shared/client/ReplayClientContext";
import { createApolloClient } from "shared/graphql/apolloClient";
import { getReadOnlyParamsFromURL, isTest } from "shared/utils/environment";
import { getRecordingId } from "shared/utils/recording";
import _App from "ui/components/App";
import { RootErrorBoundary } from "ui/components/Errors/RootErrorBoundary";
import MaintenanceModeScreen from "ui/components/MaintenanceMode";
import { ConfirmProvider } from "ui/components/shared/Confirm";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import useAuthTelemetry from "ui/hooks/useAuthTelemetry";
import { bootstrapApp } from "ui/setup";
import { listenForAccessToken } from "ui/utils/browser";
import { useLaunchDarkly } from "ui/utils/launchdarkly";
import { InstallRouteListener } from "ui/utils/routeListener";

import "../src/global-css";
import "../src/test-prep";
import "../src/base.css";

if (typeof window !== "undefined") {
  // @ts-expect-error
  Promise.prototype.finally = function (callback) {
    debugger;
    this.then(
      result => {
        callback && callback();
        return result;
      },
      result => {
        callback && callback();
        throw result;
      }
    );
  };
}

interface AuthProps {
  apiKey?: string;
}

function Routing({ Component, pageProps, accessToken }: AppProps & { accessToken: string | null }) {
  const [store, setStore] = useState<Store | null>(null);
  const { getFeatureFlag } = useLaunchDarkly();

  useEffect(() => {
    // @ts-ignore
    async function fetchAndLog(url: string): any {
      const response = await fetch(url);
      const json = await response.json();
      console.log(json);
      return json;
    }
    async function init() {
      const store = await bootstrapApp(accessToken)

      try {
        const response = await fetchAndLog('https://swapi.dev/api/people');
        await fetchAndLog(response.next)
      } catch {}

      setStore(store)
    }

    init()
  }, [accessToken]);

  if (!store) {
    return null;
  }

  if (getFeatureFlag("maintenance-mode")) {
    return <MaintenanceModeScreen />;
  }

  return (
    <Provider store={store}>
      <MemoizedHeader />
      <RootErrorBoundary replayClient={replayClient}>
        <_App>
          <InstallRouteListener />
          <React.Suspense fallback={<LoadingScreen message="Fetching data..." />}>
            <Component {...pageProps} />
          </React.Suspense>
        </_App>
      </RootErrorBoundary>
    </Provider>
  );
}

  // Don't set a default title within the DevTools app
  // Else it overrides the recording title when the root error boundary renders
  // See FE-2041
const MemoizedHeader = memo(function MemoizedHeader() {
  const hasRecordingId = getRecordingId() != null;

  return (
    <Head>
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <link rel="icon" type="image/svg+xml" href="/recording/images/favicon.svg" />
      {hasRecordingId || <title>Replay</title>}
    </Head>
  );
});

const App = ({ apiKey, ...props }: AppProps & AuthProps) => {
  useAuthTelemetry();
  const router = useRouter();
  let head: React.ReactNode;

  // HACK: Coordinates with the recording page to render its <head> contents for
  // social meta tags. This can be removed once we are able to handle SSP
  // properly all the way to the pages. __N_SSP is a very private
  // (https://github.com/vercel/next.js/discussions/12558) Next.js prop to
  // indicate server-side rendering. It works for now but likely will be removed
  // or replaced so we need to fix our SSR and stop using it.
  if (props.__N_SSP && router.pathname.match(/^\/recording\//)) {
    head = <props.Component {...props.pageProps} headOnly />;
  }

  const tokenFromHeader = apiKey ? { token: apiKey } : undefined;
  const tokenFromURL = isTest() ? { token: getReadOnlyParamsFromURL().apiKey } : undefined;
  const [token, setToken] = useState<{ token: string | null } | undefined>(tokenFromHeader || tokenFromURL);
  useEffect(() => {
    async function fetchToken() {
      const response = await fetch("/api/token");
      const token = response.ok ? await response.text() : null;
      setToken({ token });
    }

    async function getTokenFromBrowser() {
      const token = await Promise.race([
        new Promise<string>(resolve => listenForAccessToken(resolve)),
        // if the user is not logged in, the listenForAccessToken callback
        // is never called, so we add this timeout to continue without a token
        new Promise<null>(resolve => setTimeout(() => resolve(null), 500)),
      ]);
      setToken({ token });
    }

    if (!token) {
      if (!window.__IS_RECORD_REPLAY_RUNTIME__) {
        fetchToken();
      } else {
        getTokenFromBrowser();
      }
    }
  }, [token, setToken]);

  if (!token) {
    return;
  }

  return (
    <SystemProvider>
      {head}
      <ApolloProvider
        client={createApolloClient(token.token ?? undefined, getReadOnlyParamsFromURL().testScope)}
      >
        <ConfirmProvider>
          <Routing {...props} accessToken={token.token} />
        </ConfirmProvider>
      </ApolloProvider>
    </SystemProvider>
  );
};

App.getInitialProps = (appContext: AppContext) => {
  const props = NextApp.getInitialProps(appContext);
  const authHeader = appContext.ctx.req?.headers.authorization;
  const authProps: AuthProps = { apiKey: undefined };

  if (authHeader) {
    const [scheme, token] = authHeader.split(" ", 2);
    if (!token || !/^Bearer$/i.test(scheme)) {
      console.error("Format is Authorization: Bearer [token]");
    } else {
      authProps.apiKey = token;
    }
  }

  return { ...props, ...authProps };
};

export default App;

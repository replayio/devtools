import type { AppContext, AppProps } from "next/app";
import NextApp from "next/app";
import Head from "next/head";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";

import "use-context-menu/styles.css";
import "./global.css";
import "./variables.css";
// Used by syntax highlighter
import "../components/sources/CodeMirror.css";

interface AuthProps {
  apiKey?: string;
}

function Routing({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
        <title>Replay</title>
      </Head>
      <InlineErrorBoundary name="Routing">
        <Component {...pageProps} />
      </InlineErrorBoundary>
    </>
  );
}

const App = (props: AppProps & AuthProps) => {
  return <Routing {...props} />;
};

// Forked verbatim from /pages/_app.tsx
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

import React from "react";
import crypto from "crypto";
import Document, { Html, Head, Main, NextScript } from "next/document";

const cspHashOf = (text: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(text);
  return `'sha256-${hash.digest("base64")}'`;
};

const isDev = process.env.NODE_ENV !== "production";
const csp = (props: any) => {
  const hash = cspHashOf(NextScript.getInlineScriptSource(props));
  return [
    `default-src 'self'`,
    `connect-src 'self' https://api.replay.io wss://dispatch.replay.io https://webreplay.us.auth0.com https://*.sentry.io https://*.intercom.io wss://*.intercom.io https://*.launchdarkly.com https://*.logrocket.io https://*.lr-ingest.io https://*.logrocket.com https://*.lr-in.com https://api.stripe.com ${
      // Required to talk to local backend in development
      isDev ? "http://localhost:* http://*.replay.local ws://localhost:* " : ""
    }`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `script-src 'self' https://widget.intercom.io https://js.intercomcdn.com/ https://cdn.logrocket.io https://cdn.lr-ingest.io https://cdn.lr-in.com https://js.stripe.com ${hash} ${
      // Required by local dev server
      isDev ? "'unsafe-eval'" : ""
    }`,

    // From vercel's CSP config
    isDev ? `style-src 'self' 'unsafe-inline'` : "",
    isDev ? `font-src 'self' data:` : "",

    // Required by LogRocket
    `child-src 'self' blob:`,
    `worker-src 'self' blob:`,

    // Required by intercom
    `style-src 'self' 'unsafe-inline'`,

    // Required to inline images from the database and from external avaters
    `img-src 'self' data: https:`,
  ]
    .filter(Boolean)
    .join("; ");
};

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* nosemgrep typescript.react.security.audit.react-http-leak.react-http-leak */}
          <meta httpEquiv="Content-Security-Policy" content={csp(this.props)} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

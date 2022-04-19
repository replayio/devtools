import crypto from "crypto";

import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";

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
    `connect-src 'self' https://api.replay.io wss://dispatch.replay.io https://telemetry.replay.io https://webreplay.us.auth0.com https://api-js.mixpanel.com https://*.sentry.io https://*.intercom.io wss://*.intercom.io https://*.launchdarkly.com https://*.logrocket.io https://*.lr-ingest.io https://*.logrocket.com https://*.lr-in.com https://api.stripe.com ${
      // Required to talk to local backend in development. Enabling
      // localhost:8000 for prod to support the ?dispatch parameter when running
      // the local backend
      isDev ? "http://localhost:* http://*.replay.local ws://localhost:*" : "ws://localhost:8000"
    }`,
    `frame-src https://js.stripe.com https://hooks.stripe.com https://webreplay.us.auth0.com https://www.loom.com/`,
    // unsafe-eval is required by intercom
    `script-src 'self' 'unsafe-eval' https://widget.intercom.io https://js.intercomcdn.com/ https://cdn.logrocket.io https://cdn.lr-ingest.io https://cdn.lr-in.com https://js.stripe.com ${hash}`,
    `form-action https://webreplay.us.auth0.com`,

    // From vercel's CSP config and Google fonts
    `font-src 'self' data: https://fonts.gstatic.com`,
    // Google fonts
    `style-src-elem 'self' 'unsafe-inline' https://fonts.gstatic.com`,
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
          <link rel="stylesheet" href="/fonts/inter/inter.css" />
          <link rel="stylesheet" href="/fonts/material_icons/material_icons.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

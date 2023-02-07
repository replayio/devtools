import crypto from "crypto";
import * as Sentry from "@sentry/browser";
import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

import { setErrorHandler } from "protocol/utils";
import { getAuthHost } from "ui/utils/auth";
import { isDevelopment } from "ui/utils/environment";

if (!isDevelopment()) {
  // Configure protocol to log errors to Sentry in production environments.
  setErrorHandler((error: Error) => {
    Sentry.captureException(error);
  });
}

const cspHashOf = (text: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(text);
  return `'sha256-${hash.digest("base64")}'`;
};

const isDev = process.env.NODE_ENV !== "production";
const csp = (props: any) => {
  const hash = cspHashOf(NextScript.getInlineScriptSource(props));
  const authHost = getAuthHost();
  return [
    `default-src 'self' nonce-${hash}`,
    `connect-src 'self' https://api.replay.io wss://api.replay.io wss://dispatch.replay.io ws://*.replay.prod http://*.replay.prod https://telemetry.replay.io https://${authHost} https://api-js.mixpanel.com https://*.sentry.io https://*.launchdarkly.com https://*.logrocket.io https://*.lr-ingest.io https://*.logrocket.com https://*.lr-in.com https://api.stripe.com https://vitals.vercel-insights.com nonce-${hash} ${
      // Required to talk to local backend in development. Enabling
      // localhost:8000 for prod to support the ?dispatch parameter when running
      // the local backend
      "http://localhost:* http://*.replay.local ws://*.replay.local ws://localhost:*"
    }`,
    `frame-src replay: https://js.stripe.com https://hooks.stripe.com https://${authHost} https://www.loom.com/`,
    // Required by some of our external services
    `script-src 'self' 'unsafe-eval' https://cdn.logrocket.io https://cdn.lr-ingest.io https://cdn.lr-in.com https://js.stripe.com ${hash} 'nonce-${hash}'`,
    `form-action https://${authHost}`,

    // From vercel's CSP config and Google fonts
    `font-src 'self' data: https://fonts.gstatic.com 'nonce-${hash}'`,
    // Google fonts
    `style-src-elem 'self' 'unsafe-inline' https://fonts.gstatic.com 'nonce-${hash}'`,
    // Required by LogRocket
    `child-src 'self' blob:`,
    `worker-src 'self' blob:`,

    // Required by some of our external services
    `style-src 'self' 'nonce-${hash}' 'unsafe-inline'`,

    // Required to inline images from the database and from external avaters
    `img-src 'self' 'nonce-${hash}' data: https:`,
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

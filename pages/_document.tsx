import crypto from "crypto";
import * as Sentry from "@sentry/browser";
import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

import { setErrorHandler } from "protocol/utils";
import { isDevelopment } from "shared/utils/environment";
import { getAuthHost } from "ui/utils/auth";

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
    `default-src 'self'`,
    `connect-src 'self' https://api.replay.io wss://api.replay.io wss://dispatch.replay.io ws://*.replay.prod http://*.replay.prod https://telemetry.replay.io https://${authHost} https://mixpanel-proxy.replay.io https://*.sentry.io https://*.launchdarkly.com https://*.lr-ingest.io https://*.lr-in.com https://api.stripe.com https://vitals.vercel-insights.com ${
      // Required to talk to local backend in development. Enabling
      // localhost:8000 for prod to support the ?dispatch parameter when running
      // the local backend
      "http://localhost:* http://*.replay.local ws://*.replay.local ws://localhost:*"
    } https://swapi.dev`,
    `frame-src replay: https://js.stripe.com https://hooks.stripe.com https://${authHost} https://www.loom.com/`,
    // Required by some of our external services
    `script-src 'self' 'unsafe-eval' https://cdn.lr-ingest.io https://cdn.lr-in.com https://js.stripe.com ${hash}`,
    `form-action https://${authHost}`,

    // From vercel's CSP config and Google fonts
    `font-src 'self' data: https://fonts.gstatic.com`,
    // Google fonts
    `style-src-elem 'self' 'unsafe-inline' https://fonts.gstatic.com`,

    // Required by some of our external services
    `style-src 'self' 'unsafe-inline'`,

    // Required to inline images from the database and from external avaters
    `img-src 'self' data: https:`,

    // Required for our logpoint analysis cache (which uses a Web worker)
    `worker-src 'self' blob:`,
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
          <link rel="stylesheet" href="/recording/fonts/inter/inter.css" />
          <link rel="stylesheet" href="/recording/fonts/material_icons/material_icons.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";

// patch in node-fetch for recordTelemetryData without adding it to the FE bundle
globalThis.fetch = globalThis.fetch || require("node-fetch");

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);
const getAppUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`}${path}`;

async function initAuthRequest(key: string, source: string) {
  const api = process.env.NEXT_PUBLIC_API_URL;

  if (!api) {
    throw new Error("API Server is not configured");
  }

  const resp = await fetch(api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation InitAutRequest($key: String!, $source: String = "browser") {
          initAuthRequest(input: {key: $key, source: $source}) {
            id
            challenge
            serverKey
          }
        }
      `,
      variables: {
        key,
        source,
      },
    }),
  });

  const json: any = await resp.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data.initAuthRequest;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const key = getQueryValue(req.query.key!);
  const source = getQueryValue(req.query.source || "browser");

  if (!key) {
    res.statusCode = 400;
    res.statusMessage = "Missing parameter";
    res.send("");

    return;
  }

  try {
    const redirectUri = getAppUrl("/api/browser/callback");
    const { id, challenge, serverKey } = await initAuthRequest(key, source);
    const url = `/login?challenge=${challenge}&returnTo=${redirectUri}&state=${id}`;

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("replay-browser-auth", JSON.stringify({ id, verifier: serverKey }), {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
        maxAge: 5 * 60 * 1000,
      })
    );

    res.redirect(url);
  } catch (e: any) {
    console.error(e);

    recordTelemetryData("devtools-api-browser-auth", { error: e.message, source });

    res.statusCode = 500;
    res.send("");
  }
};

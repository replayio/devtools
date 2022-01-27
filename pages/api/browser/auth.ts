import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import WorkOS from "@workos-inc/node";
import { pingTelemetry } from "ui/utils/replay-telemetry";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID;

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);
const getAppUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}${path}`;

async function initAuthRequest(key: string) {
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
        mutation InitAutRequest($key: String!) {
          initAuthRequest(input: {key: $key}) {
            id
            challenge
            serverKey
          }
        }
      `,
      variables: {
        key,
      },
    }),
  });

  const json = await resp.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data.initAuthRequest;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const key = getQueryValue(req.query.key);
  if (!key) {
    res.statusCode = 400;
    res.statusMessage = "Missing parameter";
    res.send("");

    return;
  }

  try {
    // TODO: Check for existing valid session before redirecting

    const launchRedirect = "/browser/auth";
    const redirectURI = getAppUrl("/api/browser/callback");
    const { id } = await initAuthRequest(key);
    const authorizationURL = workos.sso.getAuthorizationURL({
      provider: "GoogleOAuth",
      redirectURI,
      clientID,
    });

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("__replay_auth__", JSON.stringify({ id, redirect: launchRedirect }), {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
        maxAge: 5 * 60 * 1000,
      })
    );

    res.redirect(authorizationURL);
  } catch (e: any) {
    console.error(e);

    pingTelemetry("devtools-api-browser-auth", { error: e.message });

    res.statusCode = 500;
    res.send("");
  }
};

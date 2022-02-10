import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import { pingTelemetry } from "ui/utils/replay-telemetry";

const getQueryValue = (query: string | string[]): string =>
  Array.isArray(query) ? query[0] : query;
const getAppUrl = (path: string): string =>
  `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}${path}`;

async function initAuthRequest(key: string): Promise<unknown> {
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

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const key = getQueryValue(req.query.key);
  if (!key) {
    res.statusCode = 400;
    res.statusMessage = "Missing parameter";
    res.send("");

    return;
  }

  try {
    const clientId = "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";
    const redirectUri = getAppUrl("/api/browser/callback");
    const { id, challenge, serverKey } = (await initAuthRequest(key)) as any;
    const url = `https://webreplay.us.auth0.com/authorize?response_type=code&code_challenge_method=S256&code_challenge=${challenge}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid profile offline_access&state=${id}&audience=https://api.replay.io`;

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

    pingTelemetry("devtools-api-browser-auth", { error: e.message });

    res.statusCode = 500;
    res.send("");
  }
};

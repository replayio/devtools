import type { NextApiRequest, NextApiResponse } from "next";
import nextSession from "next-session";
import { pingTelemetry } from "ui/utils/replay-telemetry";

const getSession = nextSession();
const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);

async function refreshSession(refreshToken: string) {
  const api = process.env.NEXT_PUBLIC_API_URL;
  const secret = process.env.FRONTEND_API_SECRET;

  if (!api) {
    throw new Error("API Server is not configured");
  }

  if (!secret) {
    throw new Error("Secret is not configured");
  }

  const resp = await fetch(api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation RefreshSession($refreshToken: String!) {
          refreshSession(input: {refreshToken: $refreshToken}) {
            success
            accessToken
            accessTokenExpiration
            refreshToken
            refreshTokenExpiration
          }
        }
      `,
      variables: {
        refreshToken,
      },
    }),
  });

  const json = await resp.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data.refreshSession.success) {
    throw new Error("Failed to fulfill authentication request");
  }

  return {
    accessToken: json.data.refreshSession.accessToken,
    accessTokenExpiration: json.data.refreshSession.accessTokenExpiration,
    refreshToken: json.data.refreshSession.refreshToken,
    refreshTokenExpiration: json.data.refreshSession.refreshTokenExpiration,
  };
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  const refreshToken = getQueryValue(req.query.refreshToken);
  // const sessionCookie = req.cookies["__replay_session__"];

  // if (!sessionCookie) {
  //   res.statusCode = 500;
  //   res.statusMessage = "Missing parameter";
  //   res.send("");
  //   return;
  // }

  try {
    // const { id } = JSON.parse(sessionCookie);

    const tokens = await refreshSession(refreshToken);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(tokens));
  } catch (e: any) {
    console.error(e);

    pingTelemetry("devtools-api-browser-callback", { error: e.message });

    res.statusCode = 500;
    res.send("");
  }
};

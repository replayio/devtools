import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthClientId, getAuthHost } from "ui/utils/auth";
import { pingTelemetry } from "ui/utils/replay-telemetry";

interface Token {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);
const getAppUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}${path}`;

async function fulfillAuthRequest(id: string, token: string) {
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
        mutation FulfillAutRequest($secret: String!, $id: String!, $token: String!) {
          fulfillAuthRequest(input: {secret: $secret, id: $id, token: $token}) {
            success
          }
        }
      `,
      variables: {
        secret,
        id,
        token,
      },
    }),
  });

  const json = await resp.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data.fulfillAuthRequest.success) {
    throw new Error("Failed to fulfill authentication request");
  }

  return true;
}

async function fetchToken(code: string, verifier: string): Promise<Token> {
  const host = getAuthHost();
  const clientId = getAuthClientId();

  const resp = await fetch(`https://${host}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      audience: "https://api.replay.io",
      grant_type: "authorization_code",
      client_id: clientId,
      scope: "openid profile offline_access",
      code_verifier: verifier,
      code,
      redirect_uri: getAppUrl("/api/browser/callback"),
    }),
  });

  const token = await resp.json();

  if (token && token.refresh_token) {
    return token;
  } else {
    throw new Error("Failed to retrieve token");
  }
}

function redirectToLogin(req: NextApiRequest, res: NextApiResponse) {
  const message = getQueryValue(req.query.error_description!);

  res.redirect("/browser/error?type=auth&message=" + encodeURIComponent(message));
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const code = getQueryValue(req.query.code!);
  const state = getQueryValue(req.query.state!);
  const browserAuth = req.cookies["replay-browser-auth"];

  if (!code || !state || !browserAuth) {
    redirectToLogin(req, res);
    return;
  }

  try {
    const { verifier, id } = JSON.parse(browserAuth);

    if (id !== state) {
      throw new Error("Invalid auth request");
    }

    const token = await fetchToken(code, verifier);
    await fulfillAuthRequest(state, token.refresh_token);

    res.redirect("/browser/auth");
  } catch (e: any) {
    console.error(e);

    pingTelemetry("devtools-api-browser-callback", { error: e.message });
    redirectToLogin(req, res);
  }
};

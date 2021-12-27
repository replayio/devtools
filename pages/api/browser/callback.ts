import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

interface Token {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);

async function fulfillAuthRequest(id: string, token: string) {
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
        mutation FulfillAutRequest($secret: String!, $id: String!, $token: String!) {
          fulfillAuthRequest(input: {secret: $secret, id: $id, token: $token}) {
            success
          }
        }
      `,
      variables: {
        secret: process.env.FRONTEND_API_SECRET,
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
  const resp = await fetch("https://webreplay.us.auth0.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      audience: "https://api.replay.io",
      grant_type: "authorization_code",
      client_id: "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo",
      scope: "openid profile offline_access",
      code_verifier: verifier,
      code,
      redirect_uri: (process.env.VERCEL_URL || "http://localhost:8080") + "/api/browser/callback",
    }),
  });

  const token = await resp.json();

  if (token && token.refresh_token) {
    return token;
  } else {
    throw new Error("Failed to retrieve token");
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const code = getQueryValue(req.query.code);
  const state = getQueryValue(req.query.state);
  const browserAuth = req.cookies["replay-browser-auth"];

  if (!code || !state || !browserAuth) {
    res.statusCode = 500;
    res.statusMessage = "Missing parameter";
    res.send("");
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
    res.statusCode = 500;
    res.statusMessage = e.message;
    res.send("");
  }
};

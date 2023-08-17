import jwtDecode from "jwt-decode";
import type { NextApiRequest, NextApiResponse } from "next";

import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";
import { getAuthClientId, getAuthHost } from "ui/utils/auth";

// patch in node-fetch for pingTelemetry without adding it to the FE bundle
globalThis.fetch = globalThis.fetch || require("node-fetch");

interface Token {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);
const getAppUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`}${path}`;

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
            source
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

  return json.data.fulfillAuthRequest.source;
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
    throw new Error(token?.error_description || "Failed to retrieve token");
  }
}

function redirectToError(res: NextApiResponse, message: string) {
  const query = new URLSearchParams({
    type: "auth",
    message,
  });

  res.redirect("/browser/error?" + query.toString());
}

class AuthError extends Error {}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const code = getQueryValue(req.query.code!);
  const state = getQueryValue(req.query.state!);
  const authErrorMessage = getQueryValue(req.query.error_description!);
  const browserAuth = req.cookies["replay-browser-auth"];

  try {
    if (authErrorMessage) {
      throw new AuthError(authErrorMessage);
    }

    if (!browserAuth) {
      throw new AuthError(
        "Failed to find a required browser cookies. Are cookies enabled for replay.io?"
      );
    }

    if (!code || !state) {
      throw new AuthError("A required parameter was missing. Please try again.");
    }

    const { verifier, id } = JSON.parse(browserAuth);

    if (id !== state) {
      // This shouldn't occur and we don't need to broadcast this to the user so
      // an "uexpected error" message is okay
      throw new Error("auth state mismatch");
    }

    const token = await fetchToken(code, verifier);
    const source = await fulfillAuthRequest(state, token.refresh_token);

    const decodedToken = jwtDecode<{ sub: string }>(token.access_token);
    const authId = decodedToken.sub;
    recordTelemetryData("devtools-auth", {
      origin: "browser",
      authRequestId: id,
      // Auth0 protects this value in its logs and only reveals the last 3
      // characters so we'll do the same so we can still correlate without
      // exposing anything
      authorizationCode: `***************${code.substring(code.length - 3)}`,
      authId,
    });

    res.redirect(`/browser/auth?source=${source}`);
  } catch (e: any) {
    console.error(e);

    recordTelemetryData("devtools-api-browser-callback", { message: e.message, code: e.code });
    redirectToError(
      res,
      e instanceof AuthError ? e.message : "Unexpected error logging in. Please try again."
    );
  }
};

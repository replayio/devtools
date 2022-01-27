import type { NextApiRequest, NextApiResponse } from "next";
import { pingTelemetry } from "ui/utils/replay-telemetry";
import WorkOS, { Profile } from "@workos-inc/node";
import { generateToken, withSessionRoute } from "../../../src/withSession";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID;

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);

async function ensureUserForAuth(profile: Profile) {
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
        mutation EnsureUserForAuth($secret: String!, $profile: JSONObject!) {
          ensureUserForAuth(input: {secret: $secret, profile: $profile}) {
            success
            id
          }
        }
      `,
      variables: {
        secret,
        profile,
      },
    }),
  });

  const json = await resp.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  const { success, id } = json.data.ensureUserForAuth;
  if (!success) {
    throw new Error("Failed to fulfill authentication request");
  }

  return { userId: id };
}

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

async function fetchProfile(code: string): Promise<Profile> {
  const { profile } = await workos.sso.getProfileAndToken({
    code,
    clientID,
  });

  return profile;
}

export default withSessionRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  const code = getQueryValue(req.query.code);
  const authCookie = req.cookies["__replay_auth__"];

  if (!code || !authCookie) {
    res.statusCode = 500;
    res.statusMessage = "Missing parameter";
    res.send("");
    return;
  }

  try {
    const { id, redirect = "/browser/auth" } = JSON.parse(authCookie);
    const profile = await fetchProfile(code);

    req.session.profile = await ensureUserForAuth(profile);
    const value = await generateToken(req.session);

    if (id) {
      await fulfillAuthRequest(id, value);
    }

    await req.session.save();

    res.redirect(redirect);
  } catch (e: any) {
    console.error(e);

    pingTelemetry("devtools-api-browser-callback", { error: e.message });

    res.statusCode = 500;
    res.send("");
  }
});

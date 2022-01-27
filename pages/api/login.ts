import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import WorkOS from "@workos-inc/node";
import { pingTelemetry } from "ui/utils/replay-telemetry";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientID = process.env.WORKOS_CLIENT_ID;

const getAppUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL}${path}`;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // TODO: Check for existing valid session before redirecting

    const launchRedirect = "/";
    const redirectURI = getAppUrl("/api/browser/callback");
    const authorizationURL = workos.sso.getAuthorizationURL({
      provider: "GoogleOAuth",
      redirectURI,
      clientID,
    });

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("__replay_auth__", JSON.stringify({ redirect: launchRedirect }), {
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

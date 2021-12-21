import cookie from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

const getQueryValue = (query: string | string[]) => (Array.isArray(query) ? query[0] : query);

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
    res.statusMessage = "Missing key parameter";
    res.send("");

    return;
  }

  try {
    const clientId = "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";
    const redirectUri =
      (process.env.VERCEL_URL || "http://localhost:8080") + "/api/browser/callback";
    const { id, challenge, serverKey } = await initAuthRequest(key);
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
    res.statusCode = 500;
    res.statusMessage = e.message;
    res.send("");
  }
};

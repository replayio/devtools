import type { NextApiRequest, NextApiResponse } from "next";
import { pingTelemetry } from "ui/utils/replay-telemetry";
import { generateToken, parseToken, withSessionRoute } from "../../../src/withSession";
import { IronSessionData } from "iron-session";

export default withSessionRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let newToken: string | undefined;

  res.setHeader("content-type", "application/json");

  try {
    let profile: IronSessionData["profile"];

    if (req.body) {
      let { token } = JSON.parse(req.body);

      if (!token || typeof token !== "string") {
        throw new Error("Invalid token format");
      }

      profile = await parseToken(token);
    } else {
      profile = req.session.profile;
    }

    if (profile) {
      req.session.profile = profile;
      newToken = await generateToken(req.session);
      await req.session.save();
    }
  } catch (e: any) {
    res.statusCode = 500;
    console.error(e);

    pingTelemetry("devtools-api-browser-callback", { error: e.message });
  }

  res.send(JSON.stringify({ token: newToken }));
});

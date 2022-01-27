import type { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "../../src/withSession";

export default withSessionRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  await req.session.destroy();
  res.redirect("/");
});

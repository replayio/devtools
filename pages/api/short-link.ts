import { Dub } from "dub";
import { NextApiRequest, NextApiResponse } from "next";

const dub = new Dub({
  token: process.env.DUB_API_KEY,
  workspaceId: process.env.DUB_WORKSPACE_ID,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;

  const newLink = await dub.links.upsert({
    url,
    domain: "replay.run",
    tagIds: ["clvrlf0y40001u5txsd0p0efa"],
  });

  return res.status(200).json(newLink);
}

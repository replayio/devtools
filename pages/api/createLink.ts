import { Dub } from "dub";
import { NextApiRequest, NextApiResponse } from "next";

const dub = new Dub({
  token: process.env.DUB_API_KEY,
  workspaceId: process.env.DUB_WORKSPACE_ID,
});

async function doesLinkExist(id: string) {
  try {
    const found = await dub.links.get({
      domain: "replay.run",
      externalId: `ext_${id}`,
    });
    return found;
  } catch (error: any) {
    const dubError = error.error;
    if (dubError.code != "not_found") {
      return null;
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, url } = req.body;

  const found = await doesLinkExist(id);
  if (found) {
    return res.status(200).json(found);
  }

  const newLink = await dub.links.create({
    url,
    domain: "replay.run",
    externalId: id,
    tagIds: ["clvrlf0y40001u5txsd0p0efa"],
  });

  return res.status(200).json(newLink);
}

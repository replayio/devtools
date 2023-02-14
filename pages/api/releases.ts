import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const releases = await fetch("https://static.replay.io/downloads/releases.json");
  const json = await releases.json();
  res.status(200).json(json);
}

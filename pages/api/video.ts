import fs from "fs";
import os from "os";
import path from "path";
import { PaintPoint, ProtocolClient } from "@replayio/protocol";
import { NextApiRequest, NextApiResponse } from "next";

import { defer } from "node-protocol/utils";
import { createClient } from "node-protocol";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const address = process.env.NEXT_PUBLIC_DISPATCH_URL;

async function fetchPaintPoints({
  client,
  sessionId,
}: {
  client: ProtocolClient;
  sessionId: string;
}) {
  const findPaints = client.Graphics.findPaints({}, sessionId);
  let gPaints: PaintPoint[] = [];
  client.Graphics.addPaintPointsListener(({ paints }) => {
    gPaints.push(...paints);
  });

  await findPaints;
  console.log("found points", gPaints.length);

  return gPaints;
}

async function fetchGraphics(
  tmpDir: string,
  paintPoints: PaintPoint[],
  { client, sessionId }: { client: ProtocolClient; sessionId: string }
) {
  let prevTime = 0;
  const numPaints = paintPoints.length;
  const input = (
    await Promise.all(
      paintPoints.map(async (point, index) => {
        const duration = (point.time - prevTime) / 1000;
        const filename = path.join(tmpDir, `/${index}-${point.point}-${point.time}.jpeg`);

        prevTime = point.time;

        const { screen } = await client.Graphics.getPaintContents(
          { point: point.point, mimeType: point.screenShots[0].mimeType },
          sessionId
        );
        console.log(`${index}/${numPaints} - ${filename}`);
        fs.writeFileSync(filename, Buffer.from(screen.data, "base64"));
        return `file '${filename}'\nduration ${duration}\n`;
      })
    )
  ).join("");

  const inputFilename = path.join(tmpDir, "/input.txt");
  console.log(inputFilename);
  fs.writeFileSync(inputFilename, input);
  return inputFilename;
}

async function createVideo(tmpDir: string, input: string, recordingId: string): Promise<string> {
  const { promise, resolve, reject } = defer<string>();
  const filename = path.join(tmpDir, `/${recordingId}.mp4`);

  console.log(`starting ffmpeg`);
  const proc = ffmpeg();
  proc.input(input).inputOptions(["-safe 0"]).inputFormat("concat");

  proc
    .on("end", () => {
      console.log("Finished processing");
      resolve(filename);
    })
    .on("error", (err: any) => {
      console.log("Error:", err);
      reject(err);
    })
    .outputOptions(["-c:v libx264", "-r 30", "-pix_fmt yuv420p"])
    .save(filename);

  return promise;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { recordingId, token } = req.body;
  const tmpDir = os.tmpdir();
  console.log(`creating video for ${recordingId}...`);

  try {
    const { client } = await createClient({ address });
    await client.Authentication.setAccessToken({ accessToken: token });

    const { sessionId } = await client.Recording.createSession({ recordingId });
    console.log(`sessionId: ${sessionId}`);

    const paintPoints = await fetchPaintPoints({ client, sessionId });
    const inputFilename = await fetchGraphics(tmpDir, paintPoints, { client, sessionId });

    const videoFilename = await createVideo(tmpDir, inputFilename, recordingId);
    console.log(sessionId, inputFilename, videoFilename);

    const fileStream = fs.createReadStream(videoFilename);
    const filename = path.basename(videoFilename);

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: true });
  }
}

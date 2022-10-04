import { execSync, spawnSync } from "child_process";
import fs from "fs";
import { tmpdir } from "os";

import config from "../config";

function getRecordingId(file: string) {
  try {
    const contents = fs.readFileSync(file).toString().split("\n")[0];
    if (contents.length) {
      // Ignore any trailing URL.
      const spaceIndex = contents.indexOf(" ");
      if (spaceIndex != -1) {
        return contents.substring(0, spaceIndex);
      }
      return contents;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function recordNodeExample(scriptPath: string) {
  const nodePath = config.nodePath || execSync("which replay-node").toString().trim();
  if (!nodePath) {
    console.warn("\x1b[1m\x1b[31m" + "Node e2e tests require @replayio/node" + "\x1b[0m");
    console.log("\x1b[32m" + "npm i -g @replayio/node" + "\x1b[0m");
    return;
  }

  const recordingIdFile = tmpdir() + "/" + ((Math.random() * 1e9) | 0);

  spawnSync(nodePath, [scriptPath], {
    env: {
      ...process.env,
      RECORD_REPLAY_API_KEY: config.replayApiKey,
      RECORD_REPLAY_DISPATCH: config.backendUrl,
      RECORD_REPLAY_DRIVER: config.driverPath,
      RECORD_REPLAY_NODE: nodePath,
      RECORD_REPLAY_RECORDING_ID_FILE: recordingIdFile,
    },
    stdio: "pipe",
  });

  return getRecordingId(recordingIdFile);
}

import { spawnSync } from "child_process";
import fs from "fs";

import config from "./config";
import { tmpFile } from "./utils";

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
  if (!config.nodePath) {
    console.log(`Skipping test: RECORD_REPLAY_NODE not set`);
    return;
  }

  const recordingIdFile = tmpFile();

  spawnSync(config.nodePath, [scriptPath], {
    env: {
      ...process.env,
      RECORD_REPLAY_API_KEY: config.replayApiKey,
      RECORD_REPLAY_DISPATCH: config.backendUrl,
      RECORD_REPLAY_DRIVER: config.driverPath,
      RECORD_REPLAY_RECORDING_ID_FILE: recordingIdFile,
    },
    stdio: "inherit",
  });

  return getRecordingId(recordingIdFile);
}

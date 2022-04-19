const { spawnSync } = require("child_process");
const fs = require("fs");

const { tmpFile } = require("./utils");

function getRecordingId(file) {
  try {
    const contents = fs.readFileSync(file).toString().split("\n")[0];
    if (contents.length) {
      // Ignore any trailing URL.
      const spaceIndex = contents.indexOf(" ");
      if (spaceIndex != -1) {
        return contents.substr(0, spaceIndex);
      }
      return contents;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function recordNode(state, scriptPath) {
  if (!process.env.RECORD_REPLAY_NODE) {
    console.log(`Skipping test: RECORD_REPLAY_NODE not set`);
    return;
  }
  if (!state.driverPath) {
    console.log(`Skipping test: RECORD_REPLAY_DRIVER not set and no --driverPath flag was passed`);
    return;
  }

  const recordingIdFile = tmpFile();

  spawnSync(process.env.RECORD_REPLAY_NODE, [scriptPath], {
    env: {
      ...process.env,
      RECORD_REPLAY_API_KEY: state.replayApiKey,
      RECORD_REPLAY_DISPATCH: state.dispatchServer,
      RECORD_REPLAY_DRIVER: state.driverPath,
      RECORD_REPLAY_RECORDING_ID_FILE: recordingIdFile,
    },
    stdio: "inherit",
  });

  return getRecordingId(recordingIdFile);
}

exports.recordNode = recordNode;

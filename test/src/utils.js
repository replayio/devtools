/* Copyright 2020 Record Replay Inc. */

const https = require("https");
const os = require("os");

function tmpFile() {
  return os.tmpdir() + "/" + ((Math.random() * 1e9) | 0);
}

async function waitUntilMessage(page, message, timeout = 30_000) {
  return await new Promise((resolve, reject) => {
    setTimeout(reject, timeout);
    page.on("console", async msg => {
      try {
        const firstArg = await msg.args()[0]?.jsonValue();
        if (firstArg === message) {
          const secondArg = await msg.args()[1]?.jsonValue();
          resolve(secondArg);
        }
      } catch (e) {
        console.log("Unserializable value");
      }
    });
  });
}

async function waitUntil(fn, options) {
  const { timeout, waitingFor } = { timeout: 10_000, waitingFor: "unknown", ...options };
  const start = Date.now();
  while (true) {
    const rv = await fn();
    if (rv) {
      return rv;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= timeout) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`waitUntil() timed out waiting for ${waitingFor}`);
}

function sendTelemetryEvent(telemetryEvent, tags) {
  if (!process.env.CI) {
    return;
  }

  const options = {
    headers: {
      "Content-Type": "application/json",
    },
    hostname: "telemetry.replay.io",
    method: "POST",
    path: "/",
    por: 443,
  };
  try {
    const request = https.request(options, () => {});
    request.on("error", e => {
      log(`Error sending telemetry ping: ${e}`);
    });
    request.write(
      JSON.stringify({
        event: telemetryEvent,
        ...tags,
        github_ref: process.env.GITHUB_REF,
      })
    );
    request.end();
  } catch (e) {
    console.error(`Couldn't send telemetry event ${telemetryEvent}`, e);
  }
}

function elapsedTime(state) {
  return (Date.now() - state.startTime) / 1000;
}

module.exports = {
  elapsedTime,
  sendTelemetryEvent,
  tmpFile,
  waitUntil,
  waitUntilMessage,
};

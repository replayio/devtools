#!/usr/bin/env ts-node

import assert from "node:assert/strict";
import { SimpleProtocolClient } from "@replayio/protocol";
import WebSocket from "ws";

import { devtoolsObjectPreview } from "./tests/devtools-object-preview";

import {
  findLastRecordingId,
  recordPlaywright,
  saveRecording,
} from "@devtools-repo/playwright-recorder";

const PLAYWRIGHT_TIMEOUT = 60_000;
const DISPATCH_URL = process.env.DISPATCH_ADDRESS ?? "wss://dispatch.replay.io";
const DEVTOOL_URL = process.env.DEVTOOLS_URL ?? "https://app.replay.io";

const tests = [
  {
    title: "devtools-object-preview",
    url: `${DEVTOOL_URL}/recording/appreplayio--87db126a-82cf-4477-b244-b57a118d0b1b`,
    script: devtoolsObjectPreview,
  },
];

async function sleep(timeoutMs: number) {
  return new Promise<void>(r => setTimeout(() => r(), timeoutMs));
}

async function raceForTime<T>(timeoutMs: number, promise: Promise<T>) {
  return Promise.race([
    promise,
    sleep(timeoutMs).then(() => Promise.reject(new Error(`Race timeout after ${timeoutMs}ms`))),
  ]);
}

async function main() {
  const apiKey = process.env.REPLAY_API_KEY;
  assert(apiKey, "REPLAY_API_KEY env var is required");

  for (const test of tests) {
    console.log(`Recording test: ${test.title}`);
    await raceForTime(
      PLAYWRIGHT_TIMEOUT,
      recordPlaywright(async page => {
        const waitForLogPromise = test.script(page);
        const goToPagePromise = page.goto(test.url);

        await Promise.all([goToPagePromise, waitForLogPromise]);
      })
    );

    console.log(`Looking for recording ID...`);
    const recordingId = findLastRecordingId();
    console.log(`Found Recording ID: ${recordingId}`);

    await saveRecording(
      {
        recordingId,
        title: test.title,
      },
      apiKey
    );

    console.log(`Sending performance analysis request...`);
    const socket = new WebSocket(DISPATCH_URL);
    const client = new SimpleProtocolClient(
      socket,
      {
        onClose: (code, reason) => {
          if (code !== 1000) {
            console.log("WS closed", code, reason);
          }
        },
        onError: err => console.log("WS error", err),
      },
      console.log
    );
    try {
      await client.sendCommand("Authentication.setAccessToken", {
        accessToken: apiKey,
      });
      const { sessionId } = await client.sendCommand("Recording.createSession", {
        recordingId,
      });
      await client.sendCommand(
        "Session.experimentalCommand",
        {
          name: "runPerformanceAnalysis",
          // TODO: deploy analysis-runner supporting this
          // params: {
          //   metadata: {
          //     testTitle: test.title,
          //     repo: process.env.GITHUB_REPOSITORY,
          //     branch: process.env.GITHUB_REF_NAME,
          //     pullRequest: process.env.GITHUB_PR,
          //     commit: process.env.GITHUB_SHA,
          //   },
          // },
        },
        sessionId
      );
      console.log("Performance analysis requested.");
    } finally {
      socket.close(1000, "Done");
    }
  }
}

main().catch(err => {
  console.error("Failed with error:");
  if (err instanceof Error) {
    console.error(err);
  } else if (err && typeof err === "object") {
    console.error(JSON.stringify(err));
  } else {
    console.error(err);
  }
  process.exit(1);
});

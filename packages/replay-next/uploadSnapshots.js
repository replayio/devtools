#!/usr/bin/env node

"use strict";

const github = require("@actions/github");
const { readdirSync, readFileSync, statSync } = require("fs");
const fetch = require("node-fetch");
const { join } = require("path");
const { listAllRecordings } = require("@replayio/replay");

// Upload snapshots to Delta
// https://github.com/replayio/delta/blob/main/pages/api/uploadSnapshotVariants.ts

const projectSlug = "replay";
const visualsBaseDir = join(__dirname, "playwright", "visuals");
const visualsUrl = "https://delta.replay.io";

function getSnapshotDirs() {
  const snapshotDirs = [];
  readdirSync(visualsBaseDir).forEach(entry => {
    const stats = statSync(join(visualsBaseDir, entry));
    if (stats.isDirectory()) {
      const testDir = join(visualsBaseDir, entry);
      readdirSync(testDir).forEach(entry => {
        const stats = statSync(join(testDir, entry));
        if (stats.isDirectory()) {
          snapshotDirs.push(join(testDir, entry));
        }
      });
    }
  });

  return snapshotDirs;
}

(async () => {
  // Get all recently uploaded recording data
  const recordings = listAllRecordings({
    all: true,
  });

  console.group(`Found ${recordings.length} recordings`);
  console.log(recordings);
  console.groupEnd();

  const testNameToRecordingId = {};
  const findRecordingByTestName = testName => {
    if (testNameToRecordingId[testName] !== undefined) {
      return testNameToRecordingId[testName];
    }

    for (let index = 0; index < recordings.length; index++) {
      const recording = recordings[index];
      if (recording.metadata.title === testName) {
        testNameToRecordingId[testName] = recording.id;

        return recording.id;
      }
    }

    testNameToRecordingId[testName] = null;

    return null;
  };

  const snapshotDirs = getSnapshotDirs();
  if (snapshotDirs.length == 0) {
    console.error(`Skipping: No files found in ${visualsBaseDir}`);
    process.exit(1);
  } else {
    console.log(`Found ${snapshotDirs.length} snapshots`);
  }

  const actor = github.context.actor;
  const branchName =
    github.context.payload.pull_request?.head?.ref ||
    github.context.payload.repository?.default_branch;
  const owner = github.context.repo.owner;
  const runId = github.context.runId;
  if (!actor || !branchName || !owner || !runId) {
    console.error(`Missing at least one required parameter:`, { actor, branchName, owner, runId });
    process.exit(1);
  }

  const params = {
    actor,
    branchName,
    owner,
    projectSlug,
    runId,
  };

  const url = `${visualsUrl}/api/uploadSnapshotVariants?${Object.entries(params).reduce(
    (string, [key, value]) => (string += `${key}=${value}&`),
    ""
  )}`;

  console.log(`Uploading images to: ${url}`);

  try {
    for (let index = 0; index < snapshotDirs.length; index++) {
      const snapshotDir = snapshotDirs[index];
      const metadata = readFileSync(join(snapshotDir, "metadata.json"), { encoding: "utf-8" });
      const metadataJSON = JSON.parse(metadata);
      const variants = {
        dark: readFileSync(join(snapshotDir, "dark.png"), { encoding: "base64" }),
        light: readFileSync(join(snapshotDir, "light.png"), {
          encoding: "base64",
        }),
      };

      // Use the test file name to find the matching Replay recording id
      // e.g. http://admin.replay.io/recordings/83218988-15da-4f02-9045-9ed0d658ea7b
      const recordingId = findRecordingByTestName(metadataJSON.testName);

      console.log(`Found recording ${recordingId} for test "${metadataJSON.testName}"}`);

      try {
        await uploadSnapshot({
          metadata: {
            ...metadataJSON,
            recordingId,
          },
          url,
          variants,
        });
      } catch (error) {
        console.error(error);
        console.log(`Retrying upload for file "${metadata.fileName}"`);

        // Retry a failed upload before giving up
        await uploadSnapshot({
          metadata: {
            ...metadataJSON,
            recordingId,
          },
          url,
          variants,
        });
      }
    }
  } catch (error) {
    console.error(`Upload failed (client error)\n`, error);
    process.exit(1);
  }
})();

async function uploadSnapshot({ metadata, url, variants }) {
  console.group(`uploadSnapshot()`);
  console.log(metadata);
  console.log(variants);
  console.groupEnd();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metadata, variants }),
  });
  if (response.status !== 200) {
    const text = await response.text();
    console.error(`Upload failed (server status ${response.status})\n${text}`);
    process.exit(1);
  }
}

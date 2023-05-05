#!/usr/bin/env node

"use strict";

const github = require("@actions/github");
const fs = require("fs");
const fetch = require("node-fetch");

// Upload snapshots to Delta
// https://github.com/replayio/delta/blob/main/pages/api/uploadSnapshot.ts

const visualsUrl = "https://delta.replay.io";
const projectSlug = "replay";

function getFiles(dir) {
  try {
    const files = fs.readdirSync(dir);

    const allFiles = [];

    files.forEach(file => {
      const stats = fs.statSync(`${dir}/${file}`);

      if (stats.isDirectory()) {
        allFiles.push(...getFiles(`${dir}/${file}`));
      } else {
        if (file !== ".DS_Store") {
          allFiles.push(`${dir}/${file}`);
        }
      }
    });

    return allFiles;
  } catch (e) {
    return [];
  }
}

(async () => {
  const dir = "./playwright/visuals";
  const files = getFiles(dir);
  if (files.length == 0) {
    console.error(`Skipping: No files found in ${dir}`);
    process.exit(1);
  } else {
    console.log(`Found ${files.length} files`);
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

  const url = `${visualsUrl}/api/uploadSnapshot?${Object.entries(params).reduce(
    (string, [key, value]) => (string += `${key}=${value}&`),
    ""
  )}`;

  console.log(`Uploading images to: ${url}`);

  let caughtError;
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      const base64 = fs.readFileSync(file, { encoding: "base64" });

      console.log(`Upload file "${file}" with data: ${base64}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: { base64, file } }),
      });

      if (response.status !== 200) {
        const text = await response.text();

        console.error(
          `Upload failed (server error)\n  url: ${url}\n  status: ${response.status}\n  response: ${text}`
        );

        caughtError = new Error(`Upload failed (server error) for file "${file}"`);
      }
    }
  } catch (error) {
    caughtError = error;
  }

  if (caughtError) {
    console.error(`Upload failed (client error)\n  url: ${url}\n  error:`, caughtError);

    process.exit(1);
  }
})();

#!/usr/bin/env node

"use strict";

const github = require("@actions/github");
const fs = require("fs");
const fetch = require("node-fetch");

// Upload snapshots to Delta
// https://github.com/replayio/delta/blob/main/pages/api/uploadSnapshots.ts

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

  const branchName =
    github.context.payload.pull_request?.head?.ref ||
    github.context.payload.repository?.default_branch;
  if (!branchName) {
    console.error(`Skipping: No branch found`);
    process.exit(1);
  }

  const actor = github.context.actor;
  const owner = github.context.repo.owner;
  const runId = github.context.runId;
  if (!actor || !owner || !runId) {
    console.error(`Missing at least one required parameter:`, { actor, owner, runId });
    process.exit(1);
  }

  const params = {
    actor,
    branchName,
    owner,
    projectSlug,
    runId,
  };

  const url = `${visualsUrl}/api/uploadSnapshots?${Object.entries(params).reduce(
    (string, [key, value]) => (string += `${key}=${value}&`),
    ""
  )}`;

  console.log(`Uploading images to: ${url}`);

  const images = files.map(file => {
    const base64 = fs.readFileSync(file, { encoding: "base64" });
    return { base64, file };
  });

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images }),
    });

    const json = await response.json();

    if (response.status !== 200) {
      console.error(
        `Upload failed (server error)\n  url: ${url}\n  status: ${response.status}\n  response:`,
        JSON.stringify(json, null, 2)
      );

      process.exit(1);
    }

    return json;
  } catch (error) {
    console.error(`Upload failed (client error)\n  url: ${url}\n  error:`, error);

    process.exit(1);
  }
})();

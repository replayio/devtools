#!/usr/bin/env node

"use strict";

const github = require("@actions/github");
const fetch = require("node-fetch");

// Update Delta status check
// https://github.com/replayio/delta/blob/main/pages/api/updateCheck.ts

const visualsUrl = "https://delta.replay.io";
const projectSlug = "replay";

(async () => {
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
    branchName,
    owner,
    projectSlug,
    runId,
  };

  const url = `${visualsUrl}/api/updateCheck?${Object.entries(params).reduce(
    (string, [key, value]) => (string += `${key}=${value}&`),
    ""
  )}`;

  console.log(`Updating status check at URL: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  console.log(`Response: ${text}`);

  if (response.status !== 200) {
    console.error(
      `Status check failed (server error)\n  url: ${url}\n  status: ${response.status}\n  response: ${text}`
    );

    process.exit(1);
  }
})();

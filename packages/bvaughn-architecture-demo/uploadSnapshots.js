#!/usr/bin/env node

"use strict";
const github = require("@actions/github");
const fs = require("fs");
const fetch = require("node-fetch");

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
const visualsUrl = "https://replay-visuals.vercel.app";

function getFiles(dir) {
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
}

async function createAction({ projectId }) {
  let res;

  try {
    const {
      payload: { pull_request: pullRequest, action },
      runId,
      actor,
    } = github.context;

    const branch = pullRequest?.head?.ref || "main";

    const metadata = {
      pr_url: pullRequest?.html_url,
      pr_number: pullRequest?.number,
      pr_title: pullRequest?.title,
      pr_branch: branch,
      run_id: runId,
      actor,
      commit_sha: github.context?.sha,
    };

    res = await fetch(`${visualsUrl}/api/createAction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId, branch, metadata }),
    });

    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

async function uploadImage(file, actionId) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  console.log(`Uploading ${file}`, {
    url: `${visualsUrl}/api/uploadSnapshot`,
    actionId,
    image: {
      file,
      content: content.slice(0, 100),
    },
  });

  let res;

  try {
    res = await fetch(`${visualsUrl}/api/uploadSnapshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, actionId }),
    });

    if (res.status !== 200) {
      const body = await res.text();
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
    return e;
  }
}

(async () => {
  const response = await createAction({ projectId });

  console.log("response", response);
  if (response.error) {
    console.log("error", response.error);
    return;
  }

  const actionId = response.data.id;
  const files = getFiles("./playwright/snapshots/tests");
  const res = await Promise.all(files.map(file => uploadImage(file, actionId)));
  console.log(JSON.stringify(res, null, 2));
})();

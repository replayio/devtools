#!/usr/bin/env node

"use strict";
const github = require("@actions/github");
const fs = require("fs");
const fetch = require("node-fetch");
const chunk = require("lodash/chunk");

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
const visualsUrl = "https://replay-visuals.vercel.app";

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

function getUploadImageUrl(branchName, runId) {
  return `${visualsUrl}/api/uploadSnapshot?branchName=${branchName}&projectId=${projectId}&runId=${runId}`;
}

async function uploadImage(file, branchName, runId) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  const url = getUploadImageUrl(branchName, runId);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (response.status !== 200) {
      const text = await response.text();

      console.error(`Upload failed with status: ${response.status}: ${text}`);

      return { status: response.status, error: text, serverError: true, file, content };
    }

    return response.json();
  } catch (error) {
    console.error(`Upload failed with status: ${response.status}:`, error);

    return { status: response.status, error, serverError: false, file, content };
  }
}

(async () => {
  const dir = "./playwright/visuals";
  const allFiles = getFiles(dir);

  if (allFiles.length == 0) {
    console.log(`Skipping: No files found in ${dir}`);
    process.exit(1);
  } else {
    console.log(`Found ${allFiles.length} files`);
  }

  const branchName =
    github.context.payload.pull_request?.head?.ref ||
    github.context.payload.repository?.default_branch;
  const runId = github.context.runId;

  if (!branchName) {
    console.log(`Skipping: No branch found`);
    return;
  }

  console.log(
    `Uploading images for branch "${branchName}" to:`,
    getUploadImageUrl(branchName, runId)
  );

  let results = [];
  for (const files of chunk(allFiles, 20)) {
    const res = await Promise.all(files.map(file => uploadImage(file, branchName, runId)));
    results.push(...res);
  }

  const passed = results.filter(r => r.data);
  const failed = results.filter(r => r.error);

  console.log(`${passed.length} passed snapshots`);
  console.log(
    passed
      .map(r => `${r.data?.file}\t${r.data?.status}\tprimary_changed:${r.data?.primary_changed}`)
      .join("\n")
  );

  console.log(`${failed.length} failed snapshots`);
  console.log(
    failed.map(
      r =>
        `${r.file} - ${r.serverError ? "server-error" : "client-error"} - ${JSON.stringify(
          r.error
        )} -- ${r.content}`
    )
  );

  if (failed.length > 0) {
    process.exit(1);
  }
})();

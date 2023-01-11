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

async function uploadImage(file, branch, runId) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  let res;

  try {
    res = await fetch(`${visualsUrl}/api/uploadSnapshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, branch, projectId, runId }),
    });

    if (res.status !== 200) {
      return { status: res.status, error: await res.text(), file };
    }

    return res.json();
  } catch (e) {
    return { file, status: res.status, error: e, fetchThrew: true, content };
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

  const branch =
    github.context.payload.pull_request?.head?.ref ||
    github.context.payload.repository?.default_branch;
  const runId = github.context.runId;

  if (!branch) {
    console.log(`Skipping: No branch found`);
    return;
  }
  console.log(`Uploading to branch ${branch}`);

  let results = [];

  for (const files of chunk(allFiles, 20)) {
    const res = await Promise.all(files.map(file => uploadImage(file, branch, runId)));
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
  console.log(failed.map(r => `${r.file} - ${r.fetchThrew ? "fetch-failed" : "server-failed"} - ${JSON.stringify(r.error)} -- ${r.content}`));

  if (failed.length > 0) {
    process.exit(1);
  }
})();

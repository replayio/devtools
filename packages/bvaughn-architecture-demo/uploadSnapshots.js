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

async function uploadImage(file, branch) {
  const content = fs.readFileSync(file, { encoding: "base64" });
  const image = { content, file };

  let res;

  try {
    res = await fetch(`${visualsUrl}/api/uploadSnapshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, branch, projectId }),
    });

    if (res.status !== 200) {
      return { status: res.status, error: await res.text() };
    }
    return res.json();
  } catch (e) {
    return { file, status: 500, error: e };
  }
}

(async () => {
  const files = getFiles("./playwright/visuals");
  console.log(`Found ${files.length} files`);

  const branch =
    github.context.payload.pull_request?.head?.ref ||
    github.context.payload.repository?.default_branch;

  if (!branch) {
    console.log(`Skipping: No branch found`);
    return;
  }
  console.log(`Uploading to branch ${branch}`);
  const res = await Promise.all(files.map(file => uploadImage(file, branch)));

  const passed = res.filter(r => r.status == 201);
  const failed = res.filter(r => r.status !== 201);

  console.log(`${passed.length} passed snapshots`);
  console.log(
    passed
      .map(r => `${r.data?.file}\t${r.data?.status}\tprimary_changed:${r.data?.primary_changed}`)
      .join("\n")
  );

  console.log(`${failed.length} failed snapshots`);
  console.log(failed.map(r => r.error));
})();

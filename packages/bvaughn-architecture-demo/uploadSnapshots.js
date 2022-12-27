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

  console.log(`Uploading ${file}`, {
    url: `${visualsUrl}/api/uploadSnapshot`,
    branch,
    projectId,
    image: { file, content: content.slice(0, 100) },
  });

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
    console.error("error", e);
    return { status: 500, error: e };
  }
}

(async () => {
  const { runId, sha, ref } = github.context;
  console.log(sha, ref, github.context);

  const files = getFiles("./playwright/visuals");
  console.log(files);
  const res = await Promise.all(files.map(file => uploadImage(file, ref)));
  console.log(JSON.stringify(res, null, 2));
})();

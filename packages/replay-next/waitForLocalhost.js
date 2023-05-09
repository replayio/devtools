#!/usr/bin/env node

const http = require("http");

let count = 0;

function checkUrl() {
  http
    .get("http://localhost:3000", async response => {
      if (response.statusCode === 200) {
        console.log("URL is available");
        process.exit(0);
      } else {
        console.log(`URL returned status code ${response.statusCode}`);
        const text = response.text();
        console.log(text);
      }
    })
    .on("error", err => {
      console.log(`Error: ${err.message}`);
    });
}

const intervalId = setInterval(() => {
  count += 1;
  if (count >= 60) {
    console.log("URL not found after 60 seconds");
    clearInterval(intervalId);
    process.exit(1);
  }
  checkUrl();
}, 1000);

const { spawnSync } = require("child_process");

function spawnChecked(...args) {
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

spawnChecked("npm", ["install"]);
console.log("Installed dependencies");

spawnChecked("./node_modules/.bin/webpack", ["--mode=production"]);
console.log("Built webpack");

upload("index.html", "view");
upload("dist/main.js");
upload("dist/main.js.map");
upload("dist/parserWorker.js");
upload("dist/parserWorker.js.map");
upload("dist/searchWorker.js");
upload("dist/searchWorker.js.map");

upload("src/devtools/client/shared/vendor/whatwg-url.js");

invalidateCloudFront();

function upload(src, dst) {
  dst = dst || src;
  spawnChecked(
    "aws",
    ["s3", "cp", src, `s3://recordreplay-website/${dst}`],
    { stdio: "inherit" }
  );
}

function invalidateCloudFront() {
  spawnChecked(
    "aws",
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      "E3U30CHVUQVFAF",
      "--paths",
      "/*",
    ],
    { stdio: "inherit" }
  );
}

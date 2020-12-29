const { spawnSync } = require("child_process");

function spawnChecked(...args) {
  console.log(`spawnSync`, args[0], args[1].join(" "));
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}

function uploadDir(src, dst) {
  dst = dst || src;
  spawnChecked("aws", ["s3", "cp", "--recursive", src, `s3://recordreplay-website/${dst}`], {
    stdio: "inherit",
  });
}

function upload(src, dst) {
  dst = dst || src;
  spawnChecked("aws", ["s3", "cp", src, `s3://recordreplay-website/${dst}`], { stdio: "inherit" });
}

function invalidateCloudFront() {
  spawnChecked(
    "aws",
    ["cloudfront", "create-invalidation", "--distribution-id", "E3U30CHVUQVFAF", "--paths", "/*"],
    { stdio: "inherit" }
  );
}

spawnChecked("npm", ["install"]);

spawnChecked("./node_modules/.bin/webpack", ["--mode=production"]);

upload("index.html", "view");
upload("dist/main.js");
upload("dist/main.js.map");
upload("dist/parserWorker.js");
upload("dist/parserWorker.js.map");
upload("dist/searchWorker.js");
upload("dist/searchWorker.js.map");

uploadDir("src/image/images", "images");

invalidateCloudFront();

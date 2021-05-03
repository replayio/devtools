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

spawnChecked("earthly", ["--build-arg", "REPLAY_RELEASE=$GIT_SHA", "+dist"]);

upload("index.html", "view");
uploadDir("dist");
uploadDir("src/image/images", "images");

invalidateCloudFront();

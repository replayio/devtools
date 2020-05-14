
const { spawnSync } = require("child_process");

const bucket = "webreplay-website";

function upload(src, dst) {
  if (!dst) {
    dst = src;
  }
  spawnSync("aws", ["s3", "cp", src, `s3://${bucket}/${dst}`], { stdio: "inherit" });
}

upload("index.html", "main");
upload("dist/main.js");
upload("src/devtools/client/shared/sourceeditor/codemirror/codemirror.bundle.js");

const { readdirSync, statSync } = require("fs");
const { spawnSync } = require("child_process");

spawnSync(process.execPath, ["build"]);
const files = readdirSync("dist");
const mainBundle = files.find(file => file.startsWith("main.") && file.endsWith(".js"));
const { size } = statSync(`dist/${mainBundle}`);
if (size > 3000000) {
  console.error(`The main bundle's size is ${size} bytes`);
  process.exit(1);
}

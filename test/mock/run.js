const { spawnSync } = require("child_process");
const manifest = require("./manifest");
const { listAllRecordings, uploadRecording } = require("@recordreplay/recordings-cli");
const { match } = require("assert");

const devtools = `${__dirname}/../..`;
let scriptsToRun = [];

function processArgs() {
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    switch (arg) {
      case "--pattern":
        const pattern = process.argv[++i];

        if (pattern) {
          const matched = manifest.filter(t => t.match(pattern));
          if (!matched.length) {
            console.log(
              `supplied pattern: ${pattern} matched 0 tests in the manifest. It will be ignored.`
            );
          }
          scriptsToRun = scriptsToRun.concat(matched);
        }
        break;
    }
  }
}

async function main() {
  let allPassed = true;
  processArgs();
  const scripts = scriptsToRun.length > 0 ? scriptsToRun : manifest;
  for (const script of scripts) {
    console.log(`Starting test ${script}`);
    const rv = spawnSync(
      `${devtools}/node_modules/.bin/ts-node`,
      ["-r", "tsconfig-paths/register", `test/mock/scripts/${script}`],
      {
        stdio: "inherit",
        cwd: devtools,
        env: {
          ...process.env,
          PLAYWRIGHT_HEADLESS: "1",
        },
      }
    );
    if (rv.status) {
      const recordings = listAllRecordings();
      let url = "<recording unavailable";
      if (recordings.length) {
        const recordingId = await uploadRecording(recordings[recordings.length - 1].id);
        if (recordingId) {
          url = `https://app.replay.io/recording/${recordingId}`;
        }
      }
      // Log an error which github will recognize.
      const msg = `::error ::Failure ${script} ${url}`;
      spawnSync("echo", [msg], { stdio: "inherit" });
      allPassed = false;
    }
  }
  console.log(allPassed ? "All tests passed." : "Had test failures.");
  process.exit(allPassed ? 0 : 1);
}

main();

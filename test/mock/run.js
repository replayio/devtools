const { spawnSync } = require("child_process");
const manifest = require("./manifest");
const { listAllRecordings, uploadRecording } = require("@recordreplay/recordings-cli");

const devtools = `${__dirname}/../..`;

async function main() {
  let allPassed = true;
  for (const script of manifest) {
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
          url = `https://app.replay.io?id=${recordingId}`;
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

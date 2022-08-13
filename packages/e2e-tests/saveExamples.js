const playwright = require("@recordreplay/playwright");
const replay = require("@replayio/replay");
const fs = require("fs");

async function waitUntilMessage(page, message, timeout = 30_000) {
  return await new Promise((resolve, reject) => {
    let timer = setTimeout(reject, timeout);
    page.on("console", async msg => {
      try {
        const firstArg = await msg.args()[0]?.jsonValue();
        // console.log(firstArg);
        if (firstArg === message) {
          const secondArg = await msg.args()[1]?.jsonValue();
          clearTimeout(timer);
          resolve(secondArg);
        }
      } catch (e) {
        console.log("Unserializable value");
      }
    });
  });
}

async function recordExample(example) {
  let browser, context, page;
  try {
    console.log(`Recording ${example}`);
    browser = await playwright["firefox"].launch({
      // executablePath: state.browserPath,
      headless: true,
    });

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();

    await page.goto(`http://localhost:8080/test/examples/${example}`);
    await waitUntilMessage(page, "ExampleFinished");
    console.log(`Recorded ${example}`);

    await saveRecording(example);
  } catch (e) {
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

async function saveRecording(example) {
  console.log(`Saving ${example}`);
  const recordings = replay.listAllRecordings();
  const lastRecording = recordings[recordings.length - 2];
  const id = await replay.uploadRecording(lastRecording.id, {
    apiKey: "rwk_90fWQyJdA32Ny8helYNm9gy6vtqJnOXH3JkbYMviyuf",
  });

  const savedExamples = JSON.parse(fs.readFileSync(`${__dirname}/examples.json`));
  fs.writeFileSync(
    `${__dirname}/examples.json`,
    JSON.stringify({ ...savedExamples, [example]: id }, null, 2)
  );
  console.log(`Saved ${example}`);
}

async function recordExamples() {
  const files = fs.readdirSync(`public/test/examples`);
  const pages = files.filter(file => file.startsWith("doc"));
  for (const page of pages) {
    await recordExample(page);
  }
}

// recordExample("doc_control_flow.html");
// saveRecording("doc_control_flow.html");

//     console.log("ExampleFinished");
recordExamples();

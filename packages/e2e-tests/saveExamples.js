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
  let browser, context, page, succeeded;
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
    succeeded = true;
  } catch (e) {
    succeeded = false;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  if (succeeded) {
    await saveRecording(example);
  }
}

async function publicizeRecording(id) {
  `mutation PublicizeRecording {
    update_recordings_by_pk(_set: {is_private: false}, pk_columns: {id: "ce194585-26a0-406a-b6d7-986a969d7376"}) {
      id
    }
  }
  `;
}

async function saveRecording(example) {
  console.log(`Saving ${example}`);
  const recordings = replay.listAllRecordings();
  const lastRecording = recordings[recordings.length - 1];

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

  const examples = fs.readFileSync(`${__dirname}/examples.json`, "utf8");
  console.log(examples);
}

recordExamples();

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ConsoleMessage, test } from "@playwright/test";

type Entry = {
  prop: string;
  args?: string[];
};

const { RECORD_PROTOCOL_DATA, VISUAL_DEBUG } = process.env;

const baseDir = join(__dirname, "..", "..");

let fallbackRecordingId: string | null = null;

const format = {
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
};

function getFixtureDataPath(testFileName: string, testCaseName: string): string {
  return join(baseDir, "protocol-fixtures", getRelativeFixtureDataPath(testFileName, testCaseName));
}

function getRelativeFixtureDataPath(testFileName: string, testCaseName: string): string {
  const directoryName = testFileName.replace("tests/", "").replace(".ts", "");
  const fileName = `${testCaseName.replace(/[\/ \+]/g, "-")}.json`;
  return join(directoryName, fileName);
}

function getTestCaseAnnotation(fileName: string, line: number, testCaseName: string): string {
  const testPath = join(baseDir, fileName);
  if (existsSync(testPath)) {
    const fileContent = readFileSync(testPath, "utf-8");
    const lines = fileContent.split("\n");

    // Line is 1-based; annotations are on the line before the test case.
    const annotation = lines[line - 2].trim();

    const recordingId = annotation.replace("// ", "");
    if (recordingId) {
      return recordingId;
    }
  }

  return fallbackRecordingId!;
}

export default function testSetup(defaultRecordingId: string): void {
  if (!defaultRecordingId) {
    throw Error("Default recording id required");
  }

  fallbackRecordingId = defaultRecordingId;

  if (RECORD_PROTOCOL_DATA) {
    testSetupUpdateFixtureData();
  } else {
    testSetupNormal();
  }
}

function testSetupNormal() {
  test.beforeEach(({}, { line, titlePath }) => {
    const [fileName, testCaseName] = titlePath;

    const fixtureDataPath = getRelativeFixtureDataPath(fileName, testCaseName);
    const recordingId = getTestCaseAnnotation(fileName, line, testCaseName);

    // Share state with the next test to be passed via URL query parameters.
    // @ts-ignore
    global.debug = !!VISUAL_DEBUG;
    // @ts-ignore
    global.fixtureDataPath = fixtureDataPath;
    // @ts-ignore
    global.recordingId = recordingId;
  });

  test.afterEach(async ({ page }) => {
    const nextErrorDialog = await page.locator("nextjs-portal");
    const count = await nextErrorDialog.count();
    if (count !== 0) {
      const description = await page.locator("#nextjs__container_errors_desc");
      const textContent = await description.textContent();
      if (textContent) {
        const [name, message] = textContent.split(": ");
        const error = Error();
        error.name = name;
        error.message = message;
        throw error;
      } else {
        throw Error("Next error overlay reported uncaught error");
      }
    }
  });
}

function testSetupUpdateFixtureData() {
  let entries: Entry[] = [];

  function onConsoleMessage(consoleMessage: ConsoleMessage) {
    const text = consoleMessage.text();
    try {
      const entry: Entry = JSON.parse(text);
      entries.push(entry);
    } catch (error) {
      // Non-JSON messages are not Proxy entries; ignore them.
    }
  }

  test.beforeEach(({ page }, { line, titlePath }) => {
    const [fileName, testCaseName] = titlePath;
    const recordingId = getTestCaseAnnotation(fileName, line, testCaseName);

    entries = [];

    // Share the recording ID with the test case so it can pass it along to the test harness runner as a query parameter.
    // @ts-ignore
    global.recordingId = recordingId;

    // Tell the test to run in recording mode (so it logs fixture data to the console).
    // @ts-ignore
    global.record = true;

    page.on("console", onConsoleMessage);
  });

  test.afterEach(async ({ page }, { column, expectedStatus, line, status, titlePath }) => {
    const [fileName, testCaseName] = titlePath;

    // Wait for all outstanding requests to be resolved/logged.
    while (true) {
      const count = await page.evaluate("window.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT");
      if (count === 0 || count == null) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    page.off("console", onConsoleMessage);

    const prefix = `${fileName}:${line}:${column} › ${testCaseName} ›`;

    if (status !== expectedStatus) {
      // Don't update fixture data for failing tests.
      console.log(`  ${format.red("✘")}    ${format.red(prefix)} No fixture data written`);
      return;
    }

    if (entries.length === 0) {
      console.log(
        `  ${format.red("✘")}    ${format.red(prefix)} Did not generate any fixture data`
      );

      throw Error("No fixture data generated");
    }

    const fixtureDataPath = getFixtureDataPath(fileName, testCaseName);

    if (!existsSync(dirname(fixtureDataPath))) {
      mkdirSync(dirname(fixtureDataPath));
    }

    // HACK
    // If there are multiple entries for a given property (and params), remove all but the last one.
    // This is required to support getters like "loadedRegions" that are queried multiple times as data loads.
    const entriesMap: Map<string, Entry> = new Map();
    entries.forEach((entry: Entry) => {
      const key = JSON.stringify({ prop: entry.prop, args: entry.args });
      entriesMap.set(key, entry);
    });

    const uniqueEntries = Array.from(entriesMap.values());
    const additionalData =
      (await page.evaluate("window.REPLAY_CLIENT_RECORDER_ADDITIONAL_DATA")) || null;

    writeFileSync(
      fixtureDataPath,
      JSON.stringify({
        entries: uniqueEntries,
        additionalData,
      }),
      "utf-8"
    );

    console.log(`  ${format.green("✓")}    ${format.dim(prefix)} Updating fixture data`);
  });
}

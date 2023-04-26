import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { test } from "@playwright/test";

const { VISUAL_DEBUG } = process.env;

const baseDir = join(__dirname, "..", "..");

let fallbackRecordingId: string | null = null;

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

  test.beforeEach(({}, { line, titlePath }) => {
    const [fileName, testCaseName] = titlePath;

    const recordingId = getTestCaseAnnotation(fileName, line, testCaseName);

    // Share state with the next test to be passed via URL query parameters.
    // @ts-ignore
    global.debug = !!VISUAL_DEBUG;
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

import { ConsoleMessage, Page, test } from "@playwright/test";
import ErrorStackParser from "error-stack-parser";
import { writeFileSync } from "fs";
import { join } from "path";

const RECORD_PROTOCOL_DATA = !!process.env.RECORD_PROTOCOL_DATA;

type RegeneratorFunction = ({ page }: { page: Page }) => Promise<void>;

export default function testSetup(regeneratorFunction: RegeneratorFunction) {
  if (!RECORD_PROTOCOL_DATA) {
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

    return;
  }

  const parsed = ErrorStackParser.parse(new Error());
  const path = parsed[1].fileName;
  const fileName = path!.split("playwright/tests/")[1];

  let testCount: number = 0;

  test.beforeEach(() => {
    testCount++;

    if (testCount > 1) {
      throw Error(`Test setup method cannot be run with other focused tests (see ${fileName})`);
    }
  });

  test.only(`regenerate fixture data for ${fileName}`, async ({ page }) => {
    let lastConsoleMessage: ConsoleMessage | null = null;

    function onConsoleMessage(consoleMessage: ConsoleMessage) {
      lastConsoleMessage = consoleMessage;
    }

    page.on("console", onConsoleMessage);

    await regeneratorFunction({ page });

    // Wait for all outstanding requests to be resolved/logged.
    while (true) {
      const count = await page.evaluate("window.REPLAY_CLIENT_RECORDER_PENDING_REQUEST_COUNT");
      if (count === 0 || count == null) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    page.off("console", onConsoleMessage);

    if (lastConsoleMessage !== null) {
      // @ts-ignore TypeScript doesn't properly handle this case.
      const text = lastConsoleMessage.text();

      const fullFilePath = join(__dirname, "..", `${fileName}.tmp`);

      console.log(`Writing updated fixture data to:\n${fullFilePath}`);

      writeFileSync(fullFilePath, text);
    } else {
      throw Error("No new log entries were recorded");
    }
  });
}

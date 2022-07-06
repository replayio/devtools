import { ConsoleMessage, Page, test } from "@playwright/test";
import { writeFileSync } from "fs";
import { join } from "path";
import { decode, encode } from "shared/client/encoder";

const RECORD_PROTOCOL_DATA = !!process.env.RECORD_PROTOCOL_DATA;

type RegeneratorFunction = ({ page }: { page: Page }) => Promise<void>;

export default function testSetup(regeneratorFunction: RegeneratorFunction) {
  if (!RECORD_PROTOCOL_DATA) {
    return;
  }

  test.only("regenerate fixture data", async ({ page }, { titlePath }) => {
    let lastConsoleMessage: ConsoleMessage | null = null;

    function onConsoleMessage(consoleMessage: ConsoleMessage) {
      lastConsoleMessage = consoleMessage;
    }

    page.on("console", onConsoleMessage);

    await regeneratorFunction({ page });

    // Wait for all outstanding requests to be resolved/logged.
    while (true) {
      const pendingClientRequests = await page.evaluate("window.pendingClientRequests");
      if (pendingClientRequests === 0 || pendingClientRequests == null) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    page.off("console", onConsoleMessage);

    if (lastConsoleMessage !== null) {
      // @ts-ignore TypeScript doesn't properly handle this case.
      const text = lastConsoleMessage.text();

      const testFileName = titlePath[0];
      const fileName = join(__dirname, "..", "..", `${testFileName}.tmp`);

      console.log(`Writing updated fixture data to:\n${fileName}`);

      writeFileSync(fileName, text);
    } else {
      throw Error("No new log entries were recorded");
    }
  });
}

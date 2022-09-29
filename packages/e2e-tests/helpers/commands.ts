import chalk from "chalk";

import { Screen } from "./types";
import { debugPrint } from "./utils";

export async function quickOpen(screen: Screen, url: string): Promise<void> {
  debugPrint("Opening quick-open dialog", "quickOpen");
  await screen.keyboard.press("Meta+P");
  await screen.focus('[data-test-id="QuickOpenInput"]');

  debugPrint(`Filtering files by "${chalk.bold(url)}"`, "quickOpen");
  await screen.keyboard.type(url);
  await screen.waitForSelector(`[data-test-id="QuickOpenResultsList"]:has-text("${url}")`);

  debugPrint(`Opening file "${chalk.bold(url)}"`, "quickOpen");
  await screen.keyboard.press("Enter");
  await screen.waitForSelector(`[data-test-name="Source-${url}"]`);
}

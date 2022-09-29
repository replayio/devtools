import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { getSourceTab, waitForSelectedSource } from "./source-panel";
import { debugPrint, delay } from "./utils";

export async function clickSourceTreeNode(page: Page, node: string) {
  debugPrint(`Selecting source tree node: ${chalk.bold(node)}`);

  await page.locator(`div[role="tree"] div:has-text("${node}")`).nth(1).click();
}

export function getOutlinePane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-Outline"]');
}

export function getSourcesPane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-Sources"]');
}

export async function openSource(page: Page, url: string): Promise<void> {
  // If the source is already open, just focus it.
  const sourceTab = getSourceTab(page, url);
  if (await sourceTab.isVisible()) {
    debugPrint(`Source "${chalk.bold(url)}" already open`, "openSource");
    return;
  }

  debugPrint(`Opening source "${chalk.bold(url)}"`, "openSource");

  // Otherwise find it in the sources tree.
  const pane = await getSourcesPane(page);

  await openSourceExplorerPanel(page);

  let foundSource = false;

  while (true) {
    // Wait for the panel's HTML to settle (to reflect the new toggled state.)
    await pane.innerHTML();

    const item = await pane.locator(`[data-item-name="SourceTreeItem-${url}"]`);
    let count = await item.count();
    if (count > 0) {
      foundSource = true;

      // We found the source; open it and then bail.
      await item.click();

      break;
    }

    // Keep drilling in until we find the source.
    const toggles = await pane.locator('[aria-expanded="false"][data-expandable="true"]');
    count = await toggles.count();
    if (count === 0) {
      break;
    }

    await toggles.first().click();
  }

  if (!foundSource) {
    // We didn't find a matching source; the test should fail.
    throw new Error(`Could not find source with URL "${url}"`);
  }

  await waitForSelectedSource(page, url);
}

export async function openSourceExplorerPanel(page: Page): Promise<void> {
  const pane = getSourcesPane(page);
  let isVisible = false;

  try {
    const [textContent, boundingBox] = await Promise.all([
      pane.textContent({ timeout: 1000 }),
      pane.boundingBox({ timeout: 1000 }),
    ]);
    const width = boundingBox?.width ?? 0;

    // Our panel+accordion leave elements in the page, just shrunk.
    // Only consider it visible if it has a meaningful width.
    isVisible = !!textContent && width > 0;
  } catch {}

  if (!isVisible) {
    return page.locator('[data-test-name="ToolbarButton-SourceExplorer"]').click();
  }
}

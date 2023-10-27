import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, delay, waitFor } from "./utils";

type ElementsListRowOptions = {
  isSelected?: boolean;
  text?: string;
  type?: "opening" | "closing";
};

export async function activateInspectorTool(page: Page): Promise<void> {
  await page.locator("#command-button-pick").click();
}

export async function checkAppliedRules(page: Page, expected: any) {
  await waitFor(async () => {
    const appliedRules = await getAppliedRules(page);
    expect(appliedRules).toEqual(expected);
  });
}

export async function checkComputedStyle(
  page: Page,
  style: string,
  value: string,
  expectedSelectors: any = undefined
) {
  await waitFor(async () => {
    const computedStyle = await getComputedStyle(page, style);
    expect(computedStyle?.value).toEqual(value);
    if (expectedSelectors) {
      expect(computedStyle?.selectors).toEqual(expectedSelectors);
    }
  });
}

export function expandLonghands(page: Page) {
  return page.locator(".ruleview-expander").evaluateAll((expanders: HTMLElement[]) => {
    for (const expander of expanders) {
      if (expander.style.display !== "none" && !expander.classList.contains("open")) {
        expander.click();
      }
    }
  });
}

export async function expandPseudoElementRules(page: Page) {
  const header = page.locator("#rules-section-pseudoelement-header");
  if ((await header.count()) === 0) {
    return;
  }
  const classes = await header.locator(".theme-twisty").getAttribute("class");
  if (!classes?.includes("open")) {
    await header.click();
  }
}

type AppliedRules = {
  properties: Array<{
    overridden: boolean;
    text: string;
  }>;
  selector: string;
  source: string;
};

export async function getAppliedRules(page: Page): Promise<AppliedRules[]> {
  await openAppliedRulesTab(page);
  await expandPseudoElementRules(page);

  await debugPrint(page, `Gathering CSS rules`, "getAppliedRules");

  return await page.evaluate(async () => {
    const listElement = document.querySelector<HTMLElement>('[data-test-id="RulesList"]')!;
    const { clientHeight } = listElement;

    listElement.scrollTop = 0;

    // Give the list time to re-render after scrolling
    await new Promise(resolve => setTimeout(resolve, 250));

    let currentSelector: AppliedRules | null = null;
    let maxListIndex = -1;
    let results: AppliedRules[] = [];

    while (true) {
      const listItems = listElement.querySelectorAll<HTMLElement>("[data-list-index]")!;
      for (let index = 0; index < listItems.length; index++) {
        const listItem = listItems[index];
        const listIndex = parseInt(listItem.getAttribute("data-list-index")!);
        if (listIndex > maxListIndex) {
          maxListIndex = listIndex;

          switch (listItem.getAttribute("data-test-name")) {
            case "RuleListItem-DeclarationState": {
              if (currentSelector) {
                currentSelector.properties.push({
                  overridden: listItem.getAttribute("data-overridden") === "true",
                  text: listItem.textContent!,
                });
              }
              break;
            }
            case "RuleListItem-RuleState": {
              const source = listItem.querySelector(
                '[data-test-name="RuleListItem-RuleState-Source"]'
              )!;
              const selector = listItem.querySelector(
                '[data-test-name="RuleListItem-RuleState-Selector"]'
              )!;
              currentSelector = {
                properties: [],
                selector: selector.textContent!,
                source: source.textContent!,
              };

              results.push(currentSelector);
              break;
            }
          }
        }
      }

      // Scroll until we reach the end of the Rules list
      let prevScrollTop = listElement.scrollTop;
      listElement.scrollTop += clientHeight;
      if (prevScrollTop === listElement.scrollTop) {
        break;
      }

      // Give the list time to re-render after scrolling
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    return results;
  });
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function getComputedStyle(page: Page, style: string) {
  await openComputedPropertiesTab(page);
  return await page.evaluate(style => {
    const names = document.querySelectorAll<HTMLElement>(".computed-property-name");
    const propertyName = [...names].find(n => n!.textContent!.includes(style));
    if (!propertyName) {
      return;
    }
    const container = propertyName.closest(".computed-property-view");
    if (!container) {
      return;
    }
    const propertyValue: HTMLElement | null = container.querySelector(".computed-property-value");
    const value = propertyValue?.textContent;

    let selectors: any[] = [];
    const propertyNodes = document.querySelectorAll<HTMLElement>(".computed-property-view");
    const propertyNode = [...propertyNodes].find(
      node => node!.querySelector(".computed-property-name")!.childNodes[0].textContent === style
    );
    if (propertyNode) {
      const expander: HTMLElement | null = propertyNode.querySelector(".computed-expander");
      if (!expander!.matches(".open")) {
        expander!.click();
      }
      const selectorNodes = (propertyNode.nextSibling as HTMLElement).querySelectorAll<HTMLElement>(
        ".rule-text"
      );
      selectors = [...selectorNodes].map(selectorNode => {
        const selector = (selectorNode.children[0] as HTMLElement).innerText;
        const value = (selectorNode.children[1] as HTMLElement).innerText;
        const label = (selectorNode.previousSibling as HTMLElement).innerText;
        const previousChild = (selectorNode.previousSibling as HTMLElement).children[0];
        const url = (previousChild as HTMLElement).title;
        const overridden = (selectorNode.parentNode as HTMLElement).classList.contains(
          "computed-overridden"
        );
        return { selector, value, label, url, overridden };
      });
    }

    return { value, selectors };
  }, style);
}

export async function getElementsListRow(page: Page, options: ElementsListRowOptions = {}) {
  let { isSelected, text = "", type } = options;

  await debugPrint(
    page,
    `Searching for ${
      isSelected != null ? (isSelected ? chalk.bold("selected ") : chalk.bold("deselected ")) : ""
    }Elements row${text ? ` containing "${chalk.bold(text)}"` : ""}`,
    "getElementsListRow"
  );

  let selector = '[data-test-name="ElementsListItem"]';
  if (isSelected != null) {
    if (isSelected) {
      selector += "[data-selected]";
    } else {
      selector += ":not([data-selected])";
    }
  }

  text = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  switch (type) {
    case "closing":
      text = `</${text}`;
      break;
    case "opening":
      text = `<${text}`;
      break;
  }

  if (text) {
    selector += `:has-text("${text}")`;
  }

  return page.locator(selector);
}

// This helper function uses the Elements inspector to click on a part of the preview Canvas.
// Rather than using hard-coded pixel numbers, the x and y positions passed in should be percentages (0-1)
// which will be converted to coordinates based on the size of the preview Canvas.
export async function inspectCanvasCoordinates(
  page: Page,
  xPercentage: number,
  yPercentage: number
): Promise<void> {
  if (xPercentage < 0 || xPercentage > 1 || yPercentage < 0 || yPercentage > 1) {
    throw Error(
      `Invalid coordinate percentages passed (${xPercentage}, ${yPercentage}); must be between 0-1.`
    );
  }

  await debugPrint(
    page,
    `Inspecting preview Canvas (${xPercentage}%, ${yPercentage}%)`,
    "inspectCanvasCoordinates"
  );

  await activateInspectorTool(page);

  const pickerButton = page.locator('[title="Select an element in the video to inspect it"]')!;
  await pickerButton.click();

  const canvas = page.locator("#graphics");
  const height = await canvas.getAttribute("height");
  const width = await canvas.getAttribute("width");
  const x = xPercentage * (width as any as number);
  const y = yPercentage * (height as any as number);

  await debugPrint(
    page,
    `Clicking Canvas coordinates ${chalk.bold(x)}px (${Math.round(
      xPercentage * 100
    )}%), ${chalk.bold(y)}px (${Math.round(yPercentage * 100)}%)`,
    "inspectCanvasCoordinates"
  );

  canvas.click({ position: { x, y } });
}

export async function openAppliedRulesTab(page: Page) {
  const locator = page.locator("#ruleview-tab");
  await locator.waitFor();
  await locator.click();
}

export async function openComputedPropertiesTab(page: Page): Promise<void> {
  await openSelectedElementTab(page, "computedview-tab");
}

export async function openElementsPanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-inspector"]').click();
}

async function openSelectedElementTab(page: Page, tabId: string): Promise<void> {
  await debugPrint(page, `Opening "${tabId} tab in Elements panel`, "openSelectedElementTab");

  let tabLocator = page.locator(`#${tabId}`);

  // When there are too many tabs to render visibly,
  // some are hidden within a dropdown menu.
  const dropDownLocator = page.locator(
    '[data-test-id="InspectorTabs"] [data-test-name="ResponsiveTabsDropDownButton"]'
  );
  if (await dropDownLocator.isVisible()) {
    await dropDownLocator.click();

    // Note we need to scope this query because tab ids are not unique :(
    const possibleTabLocator = page.locator(
      `[data-test-name="ResponsiveTabsDropDownItem"] #${tabId}`
    );
    if (await possibleTabLocator.isVisible()) {
      // If the specific tab we're looking for is in this dropdown,
      // click it instead of the (hidden) tab in the main toolbar.
      tabLocator = possibleTabLocator;
    }
  }

  await tabLocator.isVisible();
  await tabLocator.click({ force: true });
}

export async function searchElementsPanel(page: Page, searchText: string): Promise<void> {
  await openElementsPanel(page);

  await debugPrint(
    page,
    `Searching Elements for text ${chalk.bold(`"${searchText}"`)}`,
    "searchElementsPanel"
  );

  const input = page.locator('[data-test-id="ElementsSearchInput"]')!;
  await input.focus();
  await input.type(searchText);
  await input.press("Enter");
}

export async function selectElementsListRow(
  page: Page,
  options: ElementsListRowOptions = {}
): Promise<Locator> {
  await openElementsPanel(page);

  const row = await getElementsListRow(page, options);

  await debugPrint(page, "Selecting Elements row", "selectElementsListRow");

  await waitFor(async () => {
    await row.waitFor();
    await row.click();
  });

  return row;
}

export async function selectRootElementsRow(page: Page): Promise<void> {
  const list = page.locator('[data-test-id="ElementsList"]');

  // Scroll to top to ensure the first row is visible
  while ((await list.locator('[data-list-index="0"]').count()) === 0) {
    await list.focus();
    await page.keyboard.press("ArrowUp");
  }

  // Select the first row
  await list.locator('[data-list-index="0"]').click();
}

export async function selectNextElementsPanelSearchResult(page: Page): Promise<void> {
  const input = page.locator('[data-test-id="ElementsSearchInput"]')!;
  await input.focus();
  await input.press("Enter");
}

export function getElementsList(page: Page) {
  return page.locator(`[data-test-id="ElementsList"]`);
}

export async function waitForElementsToLoad(page: Page): Promise<void> {
  await debugPrint(page, "Waiting for elements to load", "waitForElementsToLoad");

  const elements = getElementsList(page);
  await elements.waitFor();
}

export async function toggleElementsListRow(
  page: Page,
  rowLocator: Locator,
  open: boolean
): Promise<void> {
  const expander = rowLocator.locator('[role="button"][data-is-expanded]');
  await expander.waitFor();

  const isOpen = (await expander.getAttribute("data-is-expanded")) === "true";
  if (isOpen !== open) {
    await debugPrint(
      page,
      `Toggling element node ${chalk.bold(open ? "open" : "closed")}`,
      "toggleElementsListRow"
    );

    await expander.click();
  }

  if (isOpen) {
    // Wait for children to finish loading
    const list = getElementsList(page);
    await waitFor(async () => {
      const loadingChildren = list.getByText("Loading");
      const numChildren = await loadingChildren.count();
      expect(numChildren).toBe(0);
    });
  }
}

export async function waitForSelectedElementsRow(page: Page, text: string): Promise<Locator> {
  const locator = await getElementsListRow(page, { isSelected: true, text });
  await locator.waitFor();
  return locator;
}

export async function typeKeyAndVerifySelectedElement(
  page: Page,
  key: string,
  expectedRowText: string
) {
  debugPrint(page, `Typing ${key}...`, "typeKeyAndVerifySelectedElement");
  await page.keyboard.press(key);
  await waitForSelectedElementsRow(page, expectedRowText);
  await delay(500);
}

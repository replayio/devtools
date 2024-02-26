import { Page } from "@playwright/test";

import { delay, getCommandKey } from "./utils";

type InputAndTypeAheadOptions =
  | {
      commentId: string;
      type: "comment";
    }
  | {
      sourceLineNumber: number;
      type: "log-point-condition" | "log-point-content";
    }
  | {
      type: "terminal";
    };

export async function clearText(page: Page, selector: string) {
  await focus(page, selector);

  const input = page.locator(selector);

  // Timing awkwardness;
  // Make sure we clear all of the text (and not just most of it)
  while (((await input.textContent()) || "").trim() !== "") {
    await delay(100);

    await page.keyboard.press(`${getCommandKey()}+A`);
    await page.keyboard.press("Backspace");
  }
}

export async function focus(page: Page, selector: string) {
  // For some reason, locator.focus() does not work as expected;
  // Lexical's own Playwright tests use page.focus(selector) though and it works.
  await page.focus(selector);
}

export async function hideTypeAheadSuggestions(page: Page, options: InputAndTypeAheadOptions) {
  // Make sure to match the type-ahead and input selectors;
  // else we may type "Escape" into the wrong input and e.g. dismiss it or erase its content

  let inputSelector: string;
  let typeAheadSelector: string;

  switch (options.type) {
    case "comment":
      inputSelector = `[data-test-id="CommentInput-${options.commentId}"]`;
      typeAheadSelector = `[data-test-id="CommentInput-${options.commentId}-CodeTypeAhead"]`;
      break;
    case "log-point-condition":
      inputSelector = `[data-test-id="PointPanel-ConditionInput-${options.sourceLineNumber}"]`;
      typeAheadSelector = `[data-test-id="PointPanel-ConditionInput-${options.sourceLineNumber}-CodeTypeAhead"]`;
      break;
    case "log-point-content":
      inputSelector = `[data-test-id="PointPanel-ContentInput-${options.sourceLineNumber}"]`;
      typeAheadSelector = `[data-test-id="PointPanel-ContentInput-${options.sourceLineNumber}-CodeTypeAhead"]`;
      break;
    case "terminal":
      inputSelector = '[data-test-id="ConsoleTerminalInput"]';
      typeAheadSelector = '[data-test-id="ConsoleTerminalInput-CodeTypeAhead"]';
      break;
  }

  const list = page.locator(typeAheadSelector);

  if (await list.isVisible()) {
    const input = page.locator(inputSelector);
    await input.press("Escape");
  }
}

export async function isEditable(page: Page, selector: string): Promise<boolean> {
  const input = page.locator(selector);
  const editable = await input.getAttribute("contenteditable");
  return editable === "true";
}

export async function submitCurrentText(page: Page, options: InputAndTypeAheadOptions) {
  let inputSelector: string;
  switch (options.type) {
    case "comment":
      inputSelector = `[data-test-id="CommentInput-${options.commentId}"]`;
      break;
    case "log-point-condition":
      inputSelector = `[data-test-id="PointPanel-ConditionInput-${options.sourceLineNumber}"]`;
      break;
    case "log-point-content":
      inputSelector = `[data-test-id="PointPanel-ContentInput-${options.sourceLineNumber}"]`;
      break;
    case "terminal":
      inputSelector = '[data-test-id="ConsoleTerminalInput"]';
      break;
  }

  const input = page.locator(inputSelector);
  const initialText = await input.textContent();

  await hideTypeAheadSuggestions(page, options);

  let loopCounter = 0;

  // Timing awkwardness;
  // Sometimes the typeahead misses an "Enter" command and doesn't submit the form.
  while ((await input.textContent()) === initialText) {
    await delay(100);

    await input.press("Enter");

    if (loopCounter++ > 5) {
      // Give up after a few tries;
      // This likely indicates something unexpected.
      break;
    }
  }
}

export async function typeComment(
  page: Page,
  options: {
    commentId: string;
    text: string;
    shouldSubmit: boolean;
  }
) {
  const { commentId, text, shouldSubmit } = options;

  const inputSelector = `[data-test-id="CommentInput-${commentId}"]`;

  await clearText(page, inputSelector);

  const input = page.locator(inputSelector);
  await input.type(text);

  if (shouldSubmit) {
    await delay(200);
    await submitCurrentText(page, {
      commentId,
      type: "comment",
    });
  }
}

export async function typeLogPoint(
  page: Page,
  options: {
    shouldSubmit: boolean;
    sourceLineNumber: number;
    text: string;
    type: "condition" | "content";
  }
) {
  const { sourceLineNumber, text, shouldSubmit, type } = options;

  const inputSelector =
    type === "condition"
      ? `[data-test-id="PointPanel-ConditionInput-${sourceLineNumber}"]`
      : `[data-test-id="PointPanel-ContentInput-${sourceLineNumber}"]`;

  await clearText(page, inputSelector);

  const input = page.locator(inputSelector);
  await input.type(text);

  if (shouldSubmit) {
    await delay(200);
    await submitCurrentText(page, {
      sourceLineNumber,
      type: `log-point-${type}`,
    });
  }
}

export async function typeTerminalExpression(
  page: Page,
  options: {
    text: string;
    shouldSubmit: boolean;
  }
) {
  const { text, shouldSubmit } = options;

  const inputSelector = '[data-test-id="ConsoleTerminalInput"]';

  await clearText(page, inputSelector);

  const input = page.locator(inputSelector);
  await input.type(text);

  if (shouldSubmit) {
    await delay(200);
    await submitCurrentText(page, { type: "terminal" });
  }
}

import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { selectContextMenuItem } from "./context-menu";
import { confirmDialog } from "./dialog";
import { clearText, focus, isEditable, type as typeText } from "./lexical";
import { openSource } from "./source-explorer-panel";
import { getSourceLine } from "./source-panel";
import { debugPrint, waitFor } from "./utils";

// Keep in sync with shared/graphq/types
type CommentType =
  | "network-request"
  | "source-code"
  | "visual"
  // This is a special type that is used to indicate that the comment is a reply to another comment
  | "reply";

export async function addSourceComment(
  page: Page,
  options: {
    lineNumber: number;
    text: string;
    url: string;
  }
) {
  const { lineNumber, url, text } = options;

  await debugPrint(
    page,
    `Adding Source comment to ${chalk.bold(`${url}:${lineNumber}`)} with text "${chalk.bold(
      text
    )}"`,
    "addSourceComment"
  );

  await openSource(page, url);

  const lineLocator = await getSourceLine(page, lineNumber);
  await lineLocator.click({ button: "right" });

  const idsBefore = await getCommentIds(page, { type: "source-code" });

  await selectContextMenuItem(page, {
    contextMenuItemTestName: "ContextMenuItem-AddComment",
    contextMenuTestId: `ContextMenu-Source-${lineNumber}`,
  });

  // Wait for new comment to be added
  const commentsLocator = await getComments(page, { type: "source-code" });
  await waitFor(async () => await expect(await commentsLocator.count()).toBe(idsBefore.size + 1));

  // Find ID of new comment
  const idsAfter = await getCommentIds(page, { type: "source-code" });
  idsBefore.forEach(id => idsAfter.delete(id));
  expect(idsAfter.size).toBe(1);

  const id = Array.from(idsAfter.values())[0];
  const lexicalSelector = `[data-test-id="CommentInput-${id}"]`;
  await focus(page, lexicalSelector);
  await typeText(page, lexicalSelector, text, true);

  await expect(await isEditable(page, lexicalSelector)).toBe(false);

  const commentLocator = await getComments(page, { text, type: "source-code" });
  await expect(await commentLocator.count()).toBe(1);

  return commentLocator;
}

export async function deleteAllComments(page: Page) {
  await showCommentsPanel(page);

  const comments = await getComments(page, { type: "source-code" });
  const count = await comments.count();

  await debugPrint(page, `Deleting all ${chalk.bold(count)} comments`, "deleteAllComments");

  for (let index = count - 1; index >= 0; index--) {
    const commentLocator = comments.nth(index);
    await deleteComment(page, commentLocator);
  }
}

export async function deleteComment(page: Page, commentLocator: Locator) {
  await showCommentsPanel(page);

  const button = commentLocator.locator('[data-test-name="ContextMenuButton"]').first();
  await button.click();

  await debugPrint(page, `Deleting comment`, "deleteComment");

  await selectContextMenuItem(page, {
    contextMenuItemTestName: "ContextMenuItem-DeleteComment",
    contextMenuTestName: "ContextMenu-Comment",
  });

  await confirmDialog(page, { dialogTestName: "ConfirmDialog-DeleteComment" });
}

export async function editComment(page: Page, commentLocator: Locator, options: { text: string }) {
  const { text } = options;

  await debugPrint(page, `Edit comment to contain text "${chalk.bold(text)}"`, "editComment");

  await showCommentsPanel(page);

  const button = commentLocator.locator('[data-test-name="ContextMenuButton"]');
  await button.click();

  await selectContextMenuItem(page, {
    contextMenuItemTestName: "ContextMenuItem-EditComment",
    contextMenuTestName: "ContextMenu-Comment",
  });

  const id = (await commentLocator.getAttribute("data-test-comment-id")) as string;
  const lexicalSelector = `[data-test-id="CommentInput-${id}"]`;

  await focus(page, lexicalSelector);
  await clearText(page, lexicalSelector);
  await typeText(page, lexicalSelector, text, true);

  commentLocator = await getComment(page, id);

  await expect(await isEditable(page, lexicalSelector)).toBe(false);
  await expect(await commentLocator.textContent()).toContain(text);

  return commentLocator;
}

async function getCommentIds(page: Page, options?: { type?: CommentType }): Promise<Set<string>> {
  const ids: Set<string> = new Set();

  const commentsLocator = await getComments(page, options);
  const count = await commentsLocator.count();
  for (let index = count - 1; index >= 0; index--) {
    const commentLocator = commentsLocator.nth(index);
    const id = (await commentLocator.getAttribute("data-test-comment-id")) as string;
    ids.add(id);
  }

  return ids;
}
getComment;

export async function getComment(page: Page, id: string) {
  return page.locator(`[data-test-comment-id="${id}"]`);
}

export async function getComments(
  page: Page,
  options?: {
    text?: string;
    type?: CommentType;
  }
) {
  const { text, type } = options ?? {};

  await debugPrint(
    page,
    text
      ? `Finding "${chalk.bold(type)}" comment with text "${chalk.bold(text)}"`
      : `Finding "${chalk.bold(type)}" comment`,
    "getComments"
  );

  const textSelector = text ? `:has-text("${text}")` : "";
  const typeSelector = type ? `[data-test-comment-type="${type}"]` : "[data-test-comment-type]";

  return page.locator(`${typeSelector}${textSelector}`);
}

export async function replyToComment(
  page: Page,
  commentLocator: Locator,
  options: { text: string; url: string }
) {
  const { text, url } = options;

  await debugPrint(page, `Replying to comment with text "${chalk.bold(text)}"`, "replyToComment");

  await openSource(page, url);

  const replyButton = commentLocator.locator(`[data-test-name="CommentReplyButton"]`);
  await replyButton.click();

  const replyId = await commentLocator
    .locator('[data-test-comment-type="reply"]')
    .last()
    .getAttribute("data-test-comment-id");

  const lexicalSelector = `[data-test-id="CommentInput-${replyId}"]`;
  await focus(page, lexicalSelector);
  await typeText(page, lexicalSelector, text, true);

  await expect(await isEditable(page, lexicalSelector)).toBe(false);

  const replyLocator = await getComments(page, { text, type: "reply" });
  await expect(await replyLocator.count()).toBe(1);

  return replyLocator;
}

export async function showCommentsPanel(page: Page): Promise<void> {
  const commentsPanelLocator = page.locator('[data-test-name="CommentCardList"]');
  let isVisible = await commentsPanelLocator.isVisible();
  if (!isVisible) {
    await page.locator('[data-test-name="ToolbarButton-Comments"]').click();
  }
}

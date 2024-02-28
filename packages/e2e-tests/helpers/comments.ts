import assert from "assert";
import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { selectContextMenuItem } from "./context-menu";
import { confirmDialog } from "./dialog";
import { clearText, focus, isEditable, typeComment as typeText } from "./lexical";
import { findNetworkRequestRow } from "./network-panel";
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

async function addCommentHelper(
  page: Page,
  createComment: () => Promise<void>,
  type: CommentType,
  text: string
): Promise<void> {
  await showCommentsPanel(page);

  // Get initial ids
  const idsBefore = await getCommentIds(page, { type });

  await createComment();

  // Wait for new comment to be added
  const commentsLocator = await getComments(page, { type });
  await waitFor(async () => expect(await commentsLocator.count()).toBe(idsBefore.size + 1));

  // Get updated ids
  const idsAfter = await getCommentIds(page, { type });

  // Find ID of new comment
  idsBefore.forEach(id => idsAfter.delete(id));
  expect(idsAfter.size).toBe(1);

  const id = Array.from(idsAfter.values())[0];

  const lexicalSelector = `[data-test-id="CommentInput-${id}"]`;
  await focus(page, lexicalSelector);
  await typeText(page, { commentId: id, shouldSubmit: true, text });

  await expect(await isEditable(page, lexicalSelector)).toBe(false);
}

export async function addNetworkRequestComment(
  page: Page,
  options: {
    method: string;
    name: string;
    status: number;
    text: string;
  }
) {
  const { name, method, status, text } = options;

  await debugPrint(
    page,
    `Adding network request comment ${chalk.bold(method)} request ${chalk.bold(
      name
    )} with status ${chalk.bold(status)}`,
    "addNetworkRequestComment"
  );

  await addCommentHelper(
    page,
    async () => {
      const rowLocator = await findNetworkRequestRow(page, {
        method,
        name,
        status,
      });
      await rowLocator.click({ button: "right" });

      await selectContextMenuItem(page, {
        contextMenuItemTestName: "ContextMenuItem-AddComment",
        contextMenuTestName: `ContextMenu-NetworkRequest`,
      });
    },
    "network-request",
    text
  );

  const commentLocator = await getComments(page, { text, type: "network-request" });
  await expect(await commentLocator.count()).toBe(1);

  return commentLocator;
}

export async function addSourceCodeComment(
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
    `Adding Source code comment to ${chalk.bold(`${url}:${lineNumber}`)} with text "${chalk.bold(
      text
    )}"`,
    "addSourceCodeComment"
  );

  await openSource(page, url);

  await addCommentHelper(
    page,
    async () => {
      const lineLocator = await getSourceLine(page, lineNumber);
      await lineLocator.click({ button: "right" });

      await selectContextMenuItem(page, {
        contextMenuItemTestName: "ContextMenuItem-AddComment",
        contextMenuTestId: `ContextMenu-Source-${lineNumber}`,
      });
    },
    "source-code",
    text
  );

  const commentLocator = await getComments(page, { text, type: "source-code" });
  await expect(await commentLocator.count()).toBe(1);

  return commentLocator;
}

export async function addVisualComment(
  page: Page,
  options: {
    text: string;
    x: number;
    y: number;
  }
) {
  const { text, x, y } = options;

  await debugPrint(
    page,
    `Adding visual comment at coordinates ${chalk.bold(`${x}, ${y}`)} with text "${chalk.bold(
      text
    )}"`,
    "addVisualComment"
  );

  await addCommentHelper(
    page,
    async () => {
      const element = page.locator("#graphics");
      await element.click({ position: { x, y } });
    },
    "visual",
    text
  );

  const commentLocator = await getComments(page, { text, type: "visual" });
  await expect(await commentLocator.count()).toBe(1);

  return commentLocator;
}

export async function deleteAllComments(page: Page) {
  await showCommentsPanel(page);

  const types: CommentType[] = ["network-request", "source-code", "visual"];

  for (let index = 0; index < types.length; index++) {
    const type = types[index];

    const comments = await getComments(page, { type });
    const count = await comments.count();

    await debugPrint(page, `Deleting all ${chalk.bold(count)} comments`, "deleteAllComments");

    for (let index = count - 1; index >= 0; index--) {
      const commentLocator = comments.nth(index);
      await deleteComment(page, commentLocator);
    }
  }
}

export async function deleteComment(page: Page, commentLocator: Locator) {
  await showCommentsPanel(page);

  const button = commentLocator.locator('[data-test-name="ContextMenuButton"]').first();
  await button.click();

  const id = (await commentLocator.getAttribute("data-test-comment-id")) as string;

  await debugPrint(page, `Deleting comment ${chalk.bold(id)}`, "deleteComment");

  await selectContextMenuItem(page, {
    contextMenuItemTestName: "ContextMenuItem-DeleteComment",
    contextMenuTestId: `ContextMenu-Comment-${id}`,
  });

  await confirmDialog(page, { dialogTestName: "ConfirmDialog-DeleteComment" });
}

export async function editComment(page: Page, commentLocator: Locator, options: { text: string }) {
  const { text } = options;

  const id = (await commentLocator.getAttribute("data-test-comment-id")) as string;

  await debugPrint(
    page,
    `Edit comment ${chalk.bold(id)} to contain text "${chalk.bold(text)}"`,
    "editComment"
  );

  await showCommentsPanel(page);

  const button = commentLocator.locator('[data-test-name="ContextMenuButton"]');
  await button.click();

  await selectContextMenuItem(page, {
    contextMenuItemTestName: "ContextMenuItem-EditComment",
    contextMenuTestId: `ContextMenu-Comment-${id}`,
  });

  const lexicalSelector = `[data-test-id="CommentInput-${id}"]`;

  await focus(page, lexicalSelector);
  await clearText(page, lexicalSelector);
  await typeText(page, { commentId: id, shouldSubmit: true, text });

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

  await showCommentsPanel(page);

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

  assert(replyId != null);

  const lexicalSelector = `[data-test-id="CommentInput-${replyId}"]`;
  await focus(page, lexicalSelector);
  await typeText(page, { commentId: replyId, shouldSubmit: true, text });

  await expect(await isEditable(page, lexicalSelector)).toBe(false);

  const replyLocator = await getComments(page, { text, type: "reply" });
  await expect(await replyLocator.count()).toBe(1);

  return replyLocator;
}

export async function showCommentsPanel(page: Page): Promise<void> {
  await page.locator('[data-test-name="ToolbarButton-Comments"]').waitFor();

  const commentsPanelLocator = page.locator('[data-test-name="CommentCardList"]');
  let isVisible = await commentsPanelLocator.isVisible();
  if (!isVisible) {
    await page.locator('[data-test-name="ToolbarButton-Comments"]').click();
  }
}

export async function toggleCommentPreview(page: Page, commentLocator: Locator, visible: boolean) {
  await debugPrint(page, "Showing comment preview", "showCommentPreview");

  const button = commentLocator.locator('[data-test-name="CommentPreview-TogglePreviewButton"]');

  await expect(await button.getAttribute("data-test-preview-state")).toBe(
    visible ? "hidden" : "visible"
  );

  await button.click();

  await expect(await button.getAttribute("data-test-preview-state")).toBe(
    visible ? "visible" : "hidden"
  );
}

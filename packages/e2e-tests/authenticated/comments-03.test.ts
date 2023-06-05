import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY } from "../helpers/authentication";
import {
  addNetworkRequestComment,
  addSourceCodeComment,
  addVisualComment,
  deleteAllComments,
  toggleCommentPreview,
} from "../helpers/comments";
import { openNetworkPanel } from "../helpers/network-panel";
import { openSource } from "../helpers/source-explorer-panel";

// Each authenticated e2e test must use a unique recording id;
// else shared state from one test could impact another test running in parallel.
// TODO [SCS-1066] Share recordings between other tests
const url = "authenticated_comments_3.html";

test(`authenticated/comments-03: Comment previews`, async ({ page }) => {
  await startTest(page, url, E2E_USER_1_API_KEY);
  await openDevToolsTab(page);

  // Clean up from previous tests
  // TODO [SCS-1066] Ideally we would create a fresh recording for each test run
  await deleteAllComments(page);

  // Add and verify source code comment previews
  await openSource(page, url);
  const sourceCodeComment = await addSourceCodeComment(page, {
    lineNumber: 23,
    text: "source code",
    url,
  });
  const sourceCodePreviewText =
    (await sourceCodeComment.locator('[data-test-name="CommentPreview"]').textContent()) ?? "";
  await expect(sourceCodePreviewText.trim()).toBe("iteration++;");

  // Add and verify network comment
  await openNetworkPanel(page);
  const networkRequestComment = await addNetworkRequestComment(page, {
    method: "GET",
    name: "1",
    status: 200,
    text: "network request",
  });
  const networkRequestCommentPreviewText =
    (await networkRequestComment.locator('[data-test-name="CommentPreview"]').textContent()) ?? "";
  await expect(networkRequestCommentPreviewText.trim()).toBe("[GET] 1");

  // Add and verify visual comment
  const visualComment = await addVisualComment(page, {
    text: "visual",
    x: 100,
    y: 50,
  });
  await toggleCommentPreview(page, visualComment, true);
  await toggleCommentPreview(page, visualComment, false);

  // Clean up
  await deleteAllComments(page);
});

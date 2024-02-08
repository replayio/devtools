import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import {
  addNetworkRequestComment,
  addSourceCodeComment,
  addVisualComment,
  deleteAllComments,
  toggleCommentPreview,
} from "../helpers/comments";
import { openNetworkPanel } from "../helpers/network-panel";
import { openSource } from "../helpers/source-explorer-panel";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "authenticated_comments.html", testUsers: [E2E_USER_1] });

test(`authenticated/comments-03: Comment previews`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey: url,
  testUsers,
}) => {
  await startTest(page, recordingId, { apiKey: testUsers![0].apiKey, testScope });
  await openDevToolsTab(page);

  // Add and verify source code comment previews
  await openSource(page, url);
  const sourceCodeComment = await addSourceCodeComment(page, {
    lineNumber: 13,
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
    name: "favicon.ico",
    status: 404,
    text: "network request",
  });
  const networkRequestCommentPreviewText =
    (await networkRequestComment.locator('[data-test-name="CommentPreview"]').textContent()) ?? "";
  await expect(networkRequestCommentPreviewText.trim()).toBe("[GET] favicon.ico");

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

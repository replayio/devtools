import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  addSourceCodeComment,
  deleteAllComments,
  deleteComment,
  editComment,
} from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";

// Each authenticated e2e test must use a unique recording id;
// else shared state from one test could impact another test running in parallel.
// TODO [SCS-1066] Share recordings between other tests
const url = "authenticated_comments_1.html";

test(`authenticated/comments-01: Test add, edit, and delete comment functionality`, async ({
  page,
}) => {
  await startTest(page, url, process.env.E2E_USER_1_API_KEY);
  await openDevToolsTab(page);
  await openSource(page, url);

  // Clean up from previous tests
  // TODO [SCS-1066] Ideally we would create a fresh recording for each test run
  await deleteAllComments(page);

  let commentLocator = await addSourceCodeComment(page, {
    text: "This is a test comment",
    lineNumber: 3,
    url,
  });

  commentLocator = await editComment(page, commentLocator, { text: "This is an updated comment" });

  await deleteComment(page, commentLocator);
});

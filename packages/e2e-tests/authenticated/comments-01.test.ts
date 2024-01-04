import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY } from "../helpers/authentication";
import { addSourceCodeComment, deleteComment, editComment } from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "authenticated_comments.html" });

test(`authenticated/comments-01: Test add, edit, and delete comment functionality`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId, E2E_USER_1_API_KEY);
  await openDevToolsTab(page);
  await openSource(page, exampleKey);

  let commentLocator = await addSourceCodeComment(page, {
    text: "This is a test comment",
    lineNumber: 3,
    url: exampleKey,
  });

  commentLocator = await editComment(page, commentLocator, { text: "This is an updated comment" });

  await deleteComment(page, commentLocator);
});

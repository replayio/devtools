import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { addSourceCodeComment, deleteComment, editComment } from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "authenticated_comments.html", testUsers: [E2E_USER_1] });

test(`authenticated/comments-01: Test add, edit, and delete comment functionality`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
  testUsers,
}) => {
  await startTest(page, recordingId, { apiKey: testUsers![0].apiKey, testScope });
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

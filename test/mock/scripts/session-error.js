// Test getting a session error on startup.

const { runTest, devtoolsURL } = require("../src/runTest");
const { installMockEnvironment } = require("../src/mockEnvironment");
const { v4: uuid } = require("uuid");
const {
  createRecordingIsInitializedMock,
  createRecordingOwnerUserIdMock,
  createUserSettingsMock,
} = require("../src/graphql");

const recordingId = uuid();
const userId = uuid();
const graphqlMocks = [
  createUserSettingsMock(),
  createRecordingIsInitializedMock({ recordingId, isInitialized: true }),
  createRecordingOwnerUserIdMock({ recordingId, user: { id: userId, uuid: userId } }),
];

// Test that getting a session error while loading a replay shows an appropriate error.
runTest("sessionError", async page => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { sessionError: true, graphqlMocks });
  await page.textContent("text=Unexpected session error");
});

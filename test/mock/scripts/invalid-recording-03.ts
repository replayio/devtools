// Test that a failing GraphQL request during initialization shows an appropriate error.

import { runTest, devtoolsURL } from "../src/runTest";
import { installMockEnvironment } from "../src/mockEnvironment";
import { v4 as uuid } from "uuid";
import { createGetRecordingMock, createGetUserMock } from "../src/graphql";
import { basicMessageHandlers, basicBindings } from "../src/handlers";
import { Page } from "@recordreplay/playwright";
import { IS_RECORDING_ACCESSIBLE } from "ui/graphql/recordings";
import { GraphQLError } from "graphql";

const errorMessage = "Error from GraphQL";
const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const errorMock = {
  request: {
    query: IS_RECORDING_ACCESSIBLE,
    variables: { recordingId },
  },
  result: {
    errors: [new GraphQLError(errorMessage)],
  },
};
const graphqlMocks = [
  ...createGetUserMock({ user }),
  ...createGetRecordingMock({ recordingId, recording: {} }),
  errorMock,
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { graphqlMocks, messageHandlers, bindings });
  await page.textContent(`text=${errorMessage}`);
});

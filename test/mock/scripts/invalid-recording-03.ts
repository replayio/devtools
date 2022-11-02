// Test that a failing GraphQL request during initialization shows an appropriate error.

import { Page } from "@recordreplay/playwright";
import { GraphQLError } from "graphql";
import { v4 as uuid } from "uuid";

import { GET_RECORDING } from "ui/graphql/recordings";

import { createGetUserMock, createUserSettingsMock } from "../src/graphql";
import { cloneResponse } from "../src/graphql/utils";
import { basicBindings, basicMessageHandlers } from "../src/handlers";
import { installMockEnvironmentInPage } from "../src/mockEnvironment";
import { devtoolsURL, runTest } from "../src/runTest";

const errorMessage = "Error from GraphQL";
const recordingId = uuid();
const userId = uuid();
const user = { id: userId, uuid: userId };
const errorMock = {
  request: {
    query: GET_RECORDING,
    variables: { recordingId },
  },
  result: {
    errors: [new GraphQLError(errorMessage)],
  },
};
const graphqlMocks = [
  ...createUserSettingsMock(),
  ...createGetUserMock({ user }),
  ...cloneResponse(errorMock, 10),
];
const messageHandlers = basicMessageHandlers();
const bindings = basicBindings();

runTest("invalidRecordingID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironmentInPage(page, { graphqlMocks, messageHandlers, bindings });
  await page.textContent(`text=${errorMessage}`);
});

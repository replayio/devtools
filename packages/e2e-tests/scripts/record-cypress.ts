import { listAllRecordings, uploadRecording } from "@replayio/replay";
import cypress from "cypress";

import config, { BrowserName } from "../config";

export async function recordCypress(browserName: BrowserName, exampleFilename: string) {
  const specName = `cypress/e2e/${exampleFilename}.cy.ts`;
  const exampleUrl = `${config.devtoolsUrl}/test/examples`;

  const options = await cypress.cli.parseRunArguments([
    "cypress",
    "run",
    "-q",
    "--browser",
    browserName === "chromium" ? "replay-chromium" : "replay-firefox",
    "--spec",
    specName,
  ]);
  await cypress.run({
    ...options,
    env: {
      CYPRESS_BASE_URL: exampleUrl,
    },
  });

  const recordingId = listAllRecordings({
    filter: `function ($v) { $v.metadata.test.file = "${specName}" }`,
  })[0]?.id;

  if (recordingId) {
    await uploadRecording(recordingId, {
      apiKey: config.replayApiKey,
    });
  }

  return recordingId;
}

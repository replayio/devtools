import assert from "assert";
import fs from "fs";
import path from "path";
import type { Page, expect as expectFunction } from "@playwright/test";
import { chromium, expect } from "@playwright/test";
import { getExecutablePath } from "@replayio/playwright";
import * as cli from "@replayio/replay";
import axios from "axios";
import chalk from "chalk";

import config from "./config";

// those are copied from shared/graphql/generated
interface SetRecordingIsPrivateVariables {
  recordingId: string;
  isPrivate: boolean;
}
interface UpdateRecordingTitleVariables {
  recordingId: string;
  title: string;
}

function logError(e: any, variables: any) {
  if (e.response) {
    console.log("Parameters");
    console.log(JSON.stringify(variables, undefined, 2));
    console.log("Response");
    console.log(JSON.stringify(e.response.data, undefined, 2));
  }

  throw e.message;
}

async function makeReplayPublic(apiKey: string, recordingId: string) {
  const variables: SetRecordingIsPrivateVariables = {
    recordingId: recordingId,
    isPrivate: false,
  };

  return axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
        mutation MakeReplayPublic($recordingId: ID!, $isPrivate: Boolean!) {
          updateRecordingPrivacy(input: { id: $recordingId, private: $isPrivate }) {
            success
          }
        }
      `,
      variables,
    },
  }).catch(e => {
    logError(e, variables);
  });
}

async function updateRecordingTitle(apiKey: string, recordingId: string, title: string) {
  const variables: UpdateRecordingTitleVariables = {
    recordingId: recordingId,
    title,
  };

  return axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
        mutation UpdateRecordingTitle($recordingId: ID!, $title: String!) {
          updateRecordingTitle(input: { id: $recordingId, title: $title }) {
            success
            recording {
              uuid
              title
            }
          }
        }
      `,
      variables,
    },
  }).catch(e => {
    logError(e, variables);
  });
}

export async function saveRecording(
  {
    recordingId,
    title,
    metadata,
  }: {
    recordingId: string;
    title: string;
    metadata?: Record<string, unknown>;
  },
  apiKey: string
) {
  console.log(
    `Saving ${chalk.grey.bold(title)} with recording id ${chalk.yellow.bold(recordingId)}`
  );

  if (metadata) {
    cli.addLocalRecordingMetadata(recordingId, metadata);
  }

  await cli.uploadRecording(recordingId, {
    apiKey,
    server: config.backendUrl,
    strict: true,
  });

  const response = await axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
          query GetRecordingBuildId($recordingId: UUID!) {
            recording(uuid: $recordingId) {
              buildId
            }
          }
        `,
      variables: {
        recordingId,
      },
    },
  });

  const buildId = response.data.data.recording.buildId;
  assert(typeof buildId === "string", "Expected buildId to be a string");

  await makeReplayPublic(apiKey, recordingId);
  await updateRecordingTitle(apiKey, recordingId, title);

  return { buildId };
}

export async function recordPlaywright(
  script: (page: Page, expect: typeof expectFunction) => Promise<void>
) {
  let executablePath = config.browserPath ?? getExecutablePath() ?? undefined;

  const browserServer = await chromium.launchServer({
    env: {
      ...process.env,
      RECORD_ALL_CONTENT: "1",
      ...(config.driverPath && {
        RECORD_REPLAY_DRIVER: config.driverPath,
      }),
    },
    executablePath,
    headless: config.headless,
  });

  if (process.env.RECORD_REPLAY_VERBOSE) {
    // TODO: Always keep logs, and make them available if the recording failed.
    const stderr = browserServer.process().stderr;
    stderr?.addListener("data", data => {
      console.debug(`[RUNTIME] ${data}`);
    });
  }

  const browser = await chromium.connect(browserServer.wsEndpoint());
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  try {
    return await script(page, expect);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    await browserServer.close();
  }
}

function findLast<T>(arr: T[], predicate: (el: T) => boolean): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
}

export function findLastRecordingId(url?: string) {
  const list = cli.listAllRecordings();
  if (!url) {
    const recordingId = list[list.length - 1].id;
    assert(recordingId, "No recordings found");
    return recordingId;
  }
  const recordingId = findLast(list, rec => rec.metadata.uri === url)?.id;
  if (!recordingId) {
    const recordingsLog = readRecordingsLog().split("\n").slice(-11).join("\n");
    throw Error(
      `No recording found matching url "${url}" in list:\n${list
        .map(rec => rec.metadata.uri)
        .join("\n")}\nLast 10 lines of recordings.log:\n${recordingsLog}`
    );
  }
  return recordingId;
}

function readRecordingsLog() {
  let replayDir: string;
  if (process.env.RECORD_REPLAY_DIRECTORY) {
    replayDir = process.env.RECORD_REPLAY_DIRECTORY;
  } else {
    const dir = process.env.HOME || process.env.USERPROFILE;
    assert(dir, "HOME or USERPROFILE environment variable must be set");
    replayDir = path.join(dir, ".replay");
  }

  const file = path.join(replayDir, "recordings.log");
  return fs.readFileSync(file, "utf8");
}

export const removeRecording = (recordingId: string) => cli.removeRecording(recordingId);

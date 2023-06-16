import fs from "fs";
import path from "path";
import Debug from "debug";
import isEqual from "lodash/isEqual";

import { ReplayClient } from "shared/client/ReplayClient";
import { Annotation } from "shared/graphql/types";

import { processGroupedTestCases } from "../test-suites/RecordingTestMetadata";

require("dotenv").config();

const debug = Debug("stress-test");

// @ts-ignore
global.WebSocket = require("ws");

// @ts-ignore
global.fetch = require("node-fetch");

type Recording = {
  metadata: any;
  workspace: {
    name: string;
  };
};
type Fixture = {
  recording: Recording;
  annotations: Annotation[] | null;
  result?: any | null;
};

function getFixturePath(recordingId: string | void) {
  if (!recordingId) {
    return path.join(__dirname, `./fixtures`);
  }
  return path.join(__dirname, `./fixtures/${recordingId}.json`);
}

function getTestTitle(recording: Recording) {
  if (recording.metadata.test.title) {
    return recording.metadata.test.title;
  }

  const titlePath = recording.metadata.test.source.title;
  return titlePath.split("/")[titlePath.split("/").length - 1];
}

async function graphqlQuery(query: string, variables: any) {
  const response = await fetch("https://api.replay.io/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRESS_TEST_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request returned unexpected status: ${response.status}`);
  }

  return response.json();
}

function updateFixture(recordingId: string, fixture: Fixture) {
  if (!fs.existsSync(getFixturePath())) {
    fs.mkdirSync(getFixturePath());
  }
  fs.writeFileSync(getFixturePath(recordingId), JSON.stringify(fixture, null, 2));
}

// The fixture is a simple data structure that contains
// the recording metadata, annotations returned from the protocol, and the result
async function fetchFixture(recordingId: string): Promise<Fixture> {
  if (fs.existsSync(getFixturePath(recordingId))) {
    return JSON.parse(fs.readFileSync(getFixturePath(recordingId), "utf8"));
  }

  const recordingRes = await graphqlQuery(
    `
      query GetRecording($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          id
          metadata
          workspace {
            name
          }
        }
      }
      `,
    { recordingId }
  );

  return { recording: recordingRes.data.recording, annotations: null, result: null };
}

// The proxy client is responsible for proxying calls to findAnnotations
// such that we can either read from the fixture or fetch from the server
function createProxyClient(client: ReplayClient, fixture: Fixture) {
  return new Proxy(client, {
    get: function (target, prop, receiver) {
      if (prop == "findAnnotations") {
        return async (type: string, callback: (annotation: any) => void) => {
          if (type !== "replay-cypress") {
            return target.findAnnotations(type, callback);
          }

          // If the fixture does not have annotations lets fetch them
          // and save them to the fixture
          if (!fixture.annotations) {
            debug("fetching annotations");
            fixture.annotations = [];
            return target.findAnnotations(type, (annotation: any) => {
              fixture.annotations!.push(annotation);
              callback(annotation);
            });
          }

          // If the fixture has annotations lets just call the callback with them
          debug("reading annotations from cache");
          for (const annotation of fixture.annotations) {
            callback(annotation);
          }
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

async function testRecording(recordingId: string) {
  const shortId = recordingId.split("-")[0];
  const fixture = await fetchFixture(recordingId);
  let success;
  let result;
  let client;

  try {
    if (!fixture.recording) {
      console.log(`❌ Recording not found (${shortId}) `);
      return;
    }
    console.log(
      "🏃 Testing",
      fixture.recording?.workspace.name,
      getTestTitle(fixture.recording),
      `(${shortId})`
    );

    client = new ReplayClient("wss://dispatch.replay.io");
    const sessionId = await client.initialize(recordingId, process.env.STRESS_TEST_API_KEY!);
    debug("sessionId", sessionId);

    result = await processGroupedTestCases(
      fixture.recording.metadata.test,
      createProxyClient(client, fixture)
    );

    success = fixture.result ? isEqual(fixture.result, result) : true;
  } catch (e: any) {
    if (e.stack.includes("AssertionError") || e.stack.startsWith("Error:")) {
      console.log("❌", e.stack.split("\n").slice(0, 2).join("\n"));
    } else {
      console.log("❌", e);
    }

    success = false;
  } finally {
    updateFixture(recordingId, { ...fixture, result });
    await client?.releaseSession();
  }

  return success;
}

const recordingIdsMap = {
  // "efaed6ba-2221-4f58-9b06-03b6bdaa2518",
  // "6bd58cd4-9943-4a2e-970b-0a0dfe04fd60",

  mnite: [
    "d0fbf4e1-d413-4648-a1e8-5b94c277bf48",
    "002a8b50-b671-4941-909d-29aae777ed2f",
    "9b59a78c-3f9b-43c2-8276-d35cae43ca2a",
    "676db35c-ce90-4556-9eaa-429d6de8603e",
  ],

  sbase: [
    "d900b2fa-a476-497c-8fca-e2a387d90cd3",
    "ba4396b9-f58d-4d19-a0ac-fbcd076815da",
    "4cbab60b-44b9-4cc0-af5b-f35f8f5d8d35",
    "64697ca7-dc7f-4b3c-ab9c-d70b788e28b9",
    "aabbfea0-4958-4a67-a528-8c773b8bbd3f",
  ],

  wb: [
    "7b188dd2-496e-46aa-8212-af4a2a02929f",
    "2ed4a709-5c6e-4fbc-8ba3-aa89b339317d",
    "ffb6e79e-bd88-4fb9-be14-93ec5a3260df",
    "2438881c-4827-4812-b11a-6387a6418b13",
  ],

  mbase: [
    "ba4396b9-f58d-4d19-a0ac-fbcd076815da",
    "4cbab60b-44b9-4cc0-af5b-f35f8f5d8d35",
    "64697ca7-dc7f-4b3c-ab9c-d70b788e28b9",
    "aabbfea0-4958-4a67-a528-8c773b8bbd3f",
    "5dc32838-60b2-4b4d-9b28-b11fe1f420e4",
    "bb84830b-6139-4390-8b6e-f5a19ab20850",
    "8af99234-2977-4ddd-b21b-0a0fcd13052c",
    "3c994b00-583c-4b24-ba45-d79cea62605a",
    "6c4708af-d957-450d-90ff-12094229a158",
    "1bf12a5d-8e87-4e34-98c3-61f15363d27f",
    "205c28e3-bcf7-48e7-8523-c0bb9cd0678a",
  ],
  TC: ["31a660db-bb47-4258-9a92-0de0c1ddc1f1", "03d5445b-413f-4619-8190-ba48082c7467"],
};
const recordingIds = Object.values(recordingIdsMap).flat();

(async () => {
  let successful = true;

  const isWorkspaceKey = process.argv[2] in recordingIdsMap;

  if (process.argv[2] && !isWorkspaceKey) {
    const recordingId = recordingIds.find(rec => rec.startsWith(process.argv[2]));
    if (!recordingId) {
      console.log("❌ Recording not found");
      process.exit(1);
    }
    const result = await testRecording(recordingId);
    console.log(result ? "✅ Test passed" : "❌ Test failed", recordingId);
    process.exit(result ? 0 : 1);
  }

  // @ts-ignore
  const ids = isWorkspaceKey ? recordingIdsMap[process.argv[2]] : recordingIds;
  for (const recordingId of ids) {
    const result = await testRecording(recordingId);
    if (!result) {
      successful = false;
    }
    console.log(result ? "✅ Test passed" : "❌ Test failed", recordingId);
  }

  process.exit(successful ? 0 : 1);
})();

/*
Todo list:

[x] run processCypressTestRecording on a fixture
[x] fetch recording metadata + annotations
[x] run processX on fetched data
[x] save results to the fixtures file
[x] use replayClient proxy that either reads from the fixture or fetches 
[x] log the title + workspace 
[x] get list of recordings to test (use the test teams list)
[ ] Add timeouts
[ ] save results to Delta 

*/

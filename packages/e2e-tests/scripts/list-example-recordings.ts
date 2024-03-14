import fs from "fs";
import path from "path";
import util from "util";
import yargs from "yargs";

import { GetRecording, GetRecordingVariables } from "shared/graphql/generated/GetRecording";

import { ExamplesData } from "../helpers";
import { graphqlRequest } from "./graphqlClient";

const argv = yargs
  .option("apiKey", {
    alias: "a",
    description:
      "API key for a user with access to the target workspace (_not_ a workspace API key!)",
    type: "string",
  })
  .option("recordingId", {
    alias: "r",
    description: "Recording ID to look up",
    type: "string",
  })
  .option("example", {
    alias: "e",
    description: "Only fetch details for this one recording",
    type: "string",
  })
  .help()
  .alias("help", "h")
  .parseSync();

const examplesJsonPath = path.join(__dirname, "..", "examples.json");

const examplesData: ExamplesData = require(examplesJsonPath);

const recordingIdsToExampleNames: Record<string, string> = {};
for (const [exampleName, { recording }] of Object.entries(examplesData)) {
  recordingIdsToExampleNames[recording] = exampleName;
}

// Copied from src/ui/hooks/recordings.ts,
// and cut down to remove fields we don't need
// (Particularly `metadata`, which can include test steps)
const GET_RECORDING_QUERY = `
  query GetRecording($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      url
      title
      duration
      createdAt
      private
      isInitialized
      userRole
      resolution
      isTest
      isProcessed
      isInTestWorkspace
      owner {
        id
        name
        internal
      }
      workspace {
        id
        name
        isTest
      }
    }
  }
`;

async function fetchRecordingData(recordingId: string): Promise<GetRecording["recording"]> {
  const variables: GetRecordingVariables = {
    recordingId,
  };
  const data = await graphqlRequest<GetRecording>(argv.apiKey, GET_RECORDING_QUERY, variables);
  return data.recording;
}

function determineRecordingIdsToFetch(args: typeof argv, examples: ExamplesData): string[] {
  if (args.example) {
    return [examples[args.example]];
  } else if (args.recordingId) {
    return [args.recordingId];
  }

  console.log("Checking all examples");
  return Object.values(examples).map(({ recording }) => recording);
}

(async () => {
  try {
    if (!argv.apiKey) {
      console.error("Need to provide an API key");
      process.exit(1);
    }

    const recordingIds = determineRecordingIdsToFetch(argv, examplesData);

    console.log(
      "Fetching recording data for: ",
      recordingIds.map(recordingId => {
        return `${recordingId} (${recordingIdsToExampleNames[recordingId]})`;
      })
    );

    const recordingData = await Promise.all(
      recordingIds.map(async recordingId => {
        const recording = await fetchRecordingData(recordingId);
        return {
          ...recording,
          exampleName: recordingIdsToExampleNames[recordingId],
        };
      })
    );

    console.log("Recordings: ", util.inspect(recordingData, { depth: Infinity }));

    fs.writeFileSync("exampleRecordingsData.json", JSON.stringify(recordingData, null, 2));

    console.log("Current workspaces: ");
    const details = recordingData.map(recording => {
      return {
        id: recording.uuid,
        name: recording.exampleName,
        workspace: recording.workspace?.name ?? "unknown",
      };
    });

    console.table(details);

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();

import util from "util";
import axios from "axios";
import yargs from "yargs";

import { UpdateRecordingWorkspaceVariables } from "../../shared/graphql/generated/UpdateRecordingWorkspace";
import config from "../config";

const argv = yargs
  .option("apiKey", {
    alias: "a",
    description:
      "API key for a user with access to the target workspace (_not_ a workspace API key!)",
    type: "string",
  })
  .option("recordingId", {
    alias: "r",
    description: "Recording ID to move",
    type: "string",
  })
  .option("workspaceId", {
    alias: "w",
    description:
      "Workspace ID to move this recording to. This should be a Base64-encoded ID as shown in our URLs",
    type: "string",
  })
  .help()
  .alias("help", "h")
  .parseSync();

function logError(e: any, variables: any) {
  if (e.response) {
    console.log("GraphQL request failed. Parameters:");
    console.log(JSON.stringify(variables, undefined, 2));
    console.log("Response");
    console.log(JSON.stringify(e.response.data, undefined, 2));
  }

  throw e.message;
}

async function moveRecordingWorkspace(apiKey: string, recordingId: string, workspaceId: string) {
  const variables: UpdateRecordingWorkspaceVariables = {
    recordingId,
    workspaceId,
  };

  console.log("Moving recording to new workspace: ", {
    apiKey,
    recordingId,
    workspaceId,
  });

  try {
    const res = await axios({
      url: config.graphqlUrl,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        query: `
          mutation UpdateRecordingWorkspace($recordingId: ID!, $workspaceId: ID) {
            updateRecordingWorkspace(input: { id: $recordingId, workspaceId: $workspaceId }) {
              success
              recording {
                uuid
                workspace {
                  id
                }
              }
            }
          }
        `,
        variables,
      },
    });
    console.log("Move results: ", util.inspect(res.data, { depth: Infinity }));
  } catch (err) {
    logError(err, variables);
    throw err;
  }
}

(async () => {
  try {
    if (!argv.apiKey || !argv.recordingId || !argv.workspaceId) {
      console.error("Need to provide an API key, recording ID, and workspace ID");
      process.exit(1);
    }

    await moveRecordingWorkspace(argv.apiKey, argv.recordingId, argv.workspaceId);

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();

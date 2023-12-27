import { inngest } from "./client";
import { createClient } from "node-protocol";

const address = process.env.NEXT_PUBLIC_DISPATCH_URL;
const token = process.env.SUPPORT_ACCESS_TOKEN;

async function queryHasura(name: string, query: string, variables: object) {
  if (!process.env.HASURA_API_KEY) {
    throw new Error("HASURA_API_KEY needs to be first set in your environment variables");
  }

  const queryRes = await fetch("https://graphql.replay.io/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_API_KEY || "",
    },
    body: JSON.stringify({
      name,
      query,
      variables: variables,
    }),
  });

  const res = await queryRes.json();
  return res;
}

async function queryNewRecordings(workspaceId: string) {
  return queryHasura(
    'newRecordings',
    `query recordings($workspaceId: uuid!) {
            recordings(
              limit: 10,
              where: { workspace_id: {_eq: $workspaceId}, experimental_processing: {eq: null}} 
            ){
              id
            }
          }`,
    { workspaceId }
  )
}

async function queryProcessedRecordings(workspaceId: string) {
  let now = new Date();
  now.setHours(0, 0, 0, 0);
  let isoDateString = now.toISOString();

  return queryHasura(
    'newRecordings',
    `query recordings($workspaceId: uuid!) {
            recordings(
              limit: 10,
              where: { 
                workspace_id: {_eq: $workspaceId}, 
                experimental_processing: {eq: "processed"}
                created_at: {_gte: "${isoDateString}"}
              } 
            ){
              id
              title
              metadata
            }
          }`,
    { workspaceId }
  )
}


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello, World!" };
  },
);

function mapProcessedRecordingsToTests(recordings) { }
function getRecordingStatus(recording) { }
function getRecordingTitle(recording) { }

export const onNewRecordings = inngest.createFunction(
  {
    id: "new-recordings",
  },
  { cron: '*/10 * * * *' },
  async ({ event, step }) => {

    const workspaceId = "78eb8e0d-e5f6-40bd-85d2-b4fb7ac43459"
    const newRecordings = await queryNewRecordings(workspaceId)
    const processedRecordings = await queryProcessedRecordings(workspaceId)

    const processedTests = mapProcessedRecordingsToTests(processedRecordings);

    const recordingsToProcess = []
    const recordingsToSkip = []
    for (const recording of newRecordings) {
      if (getRecordingStatus(recording) == "failed" && !processedTests[getRecordingTitle(recording)]) {
        recordingsToProcess.push(recording.id)
      } else {
        recordingsToSkip.push(recording.id)
      }
    }

    await setProcessingState('pending', recordingsToProcess)
    await setProcessingState('skipped', recordingsToSkip)


    await step.sendEvent("recordings/pending", recordingsToProcess.map(id => ({
      name: "recordings/pending",
      data: { recordingId: id },
    })));


    // save the state to the db
    // enqueue recordings which should be processed
  },
);


export const onRecordingsPending = inngest.createFunction(
  {
    id: "pending-recordings",
    concurrency: {
      limit: 10,
    },
  },

  { event: "recordings/pending" },
  async ({ event, step }) => {
    const { client } = await createClient({ address });
    await client.Authentication.setAccessToken({ accessToken: token });

    const { recordingId } = event.data;
    const { sessionId } = await client.Recording.createSession({ recordingId });
    console.log(`sessionId: ${sessionId}`);
    await client.Recording.processRecording({ recordingId }, sessionId)
    await client.Recording.releaseSession({ sessionId }, sessionId)
  })
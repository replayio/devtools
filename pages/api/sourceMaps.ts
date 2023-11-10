import { NextApiRequest, NextApiResponse } from "next";

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

function fetchSourceMaps(filename: string, workspace_id: string): any {
  return queryHasura(
    "source_maps",
    `
        query maps($filename: String!, $workspace_id: uuid!) {
            workspace_sourcemaps(limit: 10, where: {
              workspace_id: {_eq: $workspace_id},
              filename: {_like: $filename}
            }) {
              content_hash
              created_at
              filename
              group
              id
            }
          }          
          `,
    {
      filename: `%${filename}.map`,
      workspace_id,
    }
  );
}

type RequestQuery = {
  filename: string;
  workspace_id: string;
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    console.log("[/api/sourcemaps] \n\n", request.body);

    const { filename, workspace_id } = request.body as RequestQuery;
    const sourceMapsRes = await fetchSourceMaps(filename, workspace_id);
    const sourceMaps = sourceMapsRes.data.workspace_sourcemaps;
    response.status(200).send({ sourceMaps });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: true });
  }
}

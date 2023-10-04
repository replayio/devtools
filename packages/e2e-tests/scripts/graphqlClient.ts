import axios from "axios";

import config from "../config";

function logError(e: any, query: string, variables: any) {
  console.log("Error making GraphQL request");
  console.log("Query: ", `'${query}'`);
  if (e.response) {
    console.log("Parameters");
    console.log(JSON.stringify(variables, undefined, 2));
    console.log("Response");
    console.log(JSON.stringify(e.response.data, undefined, 2));
  }

  throw e.message;
}

export async function graphqlRequest<T = unknown>(
  apiKey: string,
  graphqlQueryOrMutationContents: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const res: { data: { data: T } } = await axios({
      url: config.graphqlUrl,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        query: graphqlQueryOrMutationContents,
        variables,
      },
    });
    return res.data.data;
  } catch (err) {
    logError(err, graphqlQueryOrMutationContents, variables);

    throw err;
  }
}

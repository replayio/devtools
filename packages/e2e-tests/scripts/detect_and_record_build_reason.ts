/* Copyright 2020-2024 Record Replay Inc. */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as https from "https";

export type ChromiumBuildNumberReason = {
  reason: "chromium-build-number";
  pipelineSlug: "chromium-build";
  buildNumber: number;
  rebuild?: true;
};

export type ChromiumBranchReason = {
  reason: "chromium-branch";
  pipelineSlug: "chromium-build";
  branch: string;
  rebuild?: true;
};

export type RuntimeChromiumBuildIdReason = {
  reason: "runtime-chromium-build-id";
  chromiumBuildId: string;
  rebuild?: true;
};

export type TriggeredBuildReason = {
  reason: "triggered";
  pipelineSlug: string;
  buildNumber: number;
  buildId: string;
  rebuild?: true;
};

export type BuildReason =
  | ChromiumBuildNumberReason
  | ChromiumBranchReason
  | TriggeredBuildReason
  | RuntimeChromiumBuildIdReason
  ;

const BuildReasonArtifactPath = "build_reason.json";
async function fetchBuildReason(buildId: string): Promise<BuildReason> {
  return JSON.parse(await fetchArtifactContents(buildId, BuildReasonArtifactPath));
}

async function storeBuildReason(buildReason: BuildReason) {
  await uploadArtifactContents(
    BuildReasonArtifactPath,
    JSON.stringify(buildReason),
    "application/json"
  );

  // and return the reason
  return buildReason;
}

async function storeTriggeredBuildReason(pipelineSlug: string, buildNumber: number, buildId:  string) {
  return await storeBuildReason({
    reason: "triggered",
    pipelineSlug,
    buildNumber,
    buildId,
  });
}

async function storeChromiumBuildNumberReason(buildNumber: number) {
  return await storeBuildReason({
    reason: "chromium-build-number",
    pipelineSlug: "chromium-build",
    buildNumber,
  });
}

async function storeChromiumBranchReason(branch: string) {
  return await storeBuildReason({
    reason: "chromium-branch",
    pipelineSlug: "chromium-build",
    branch,
  });
}

async function storeRuntimeChromiumBuildIdReason(chromiumBuildId: string) {
  return await storeBuildReason({
    reason: "runtime-chromium-build-id",
    chromiumBuildId,
  });
}

export async function detectAndRecordBuildReason() {
  // grab all the env vars we might need
  const {
    BUILDKITE_REBUILT_FROM_BUILD_ID,
    BUILDKITE_TRIGGERED_FROM_BUILD_ID,
    BUILDKITE_TRIGGERED_FROM_BUILD_PIPELINE_SLUG,
    BUILDKITE_TRIGGERED_FROM_BUILD_NUMBER,
    RUNTIME_CHROMIUM_BUILDKITE_BUILD_NUMBER,
    RUNTIME_CHROMIUM_BUILDKITE_BRANCH,
    RUNTIME_CHROMIUM_BUILD_ID,
  } = process.env;

  if (BUILDKITE_REBUILT_FROM_BUILD_ID) {
    // if we're running due to a rebuilt, fetch the build reason of the build we're rebuilt from,
    // and record it as an artifact.
    const buildReason = await fetchBuildReason(BUILDKITE_REBUILT_FROM_BUILD_ID);
    return await storeBuildReason({ ...buildReason, rebuild: true });
  }

  if (BUILDKITE_TRIGGERED_FROM_BUILD_ID) {
    // if we're running due to a triggered build, record that info in an artifact.
    // we assume if BUILDKITE_TRIGGERED_FROM_BUILD_ID is set, then the other two are also set.
    return await storeTriggeredBuildReason(
      BUILDKITE_TRIGGERED_FROM_BUILD_PIPELINE_SLUG,
      parseInt(BUILDKITE_TRIGGERED_FROM_BUILD_NUMBER),
      BUILDKITE_TRIGGERED_FROM_BUILD_ID
    );
  }

  // otherwise we got here from a New Build in the UI.  check for env vars that we can use to
  // record the artifact location.

  if (RUNTIME_CHROMIUM_BUILDKITE_BUILD_NUMBER) {
    // the user specified a build number from the chromium pipeline.  fetch the build_id from
    // there and record our artifact.
    return await storeChromiumBuildNumberReason(
      parseInt(RUNTIME_CHROMIUM_BUILDKITE_BUILD_NUMBER)
    );
  }

  if (RUNTIME_CHROMIUM_BUILDKITE_BRANCH) {
    // the user specified a branch from the chromium pipeline.
    return await storeChromiumBranchReason(RUNTIME_CHROMIUM_BUILDKITE_BRANCH);
  }

  if (RUNTIME_CHROMIUM_BUILD_ID) {
    // the user specified the build id of an uploaded build.  record our artifact.
    return await storeRuntimeChromiumBuildIdReason(RUNTIME_CHROMIUM_BUILD_ID);
  }

  // if we got here, the user clicked New Build but didn't specify any other environment variables.
  // act as if they had specified RUNTIME_CHROMIUM_BUILDKITE_BRANCH=master and record our artifact.
  return await storeChromiumBranchReason("master");
}

async function graphql<ResultT, VariablesT = Record<string, unknown>>(query: string, variables: VariablesT) {
  return new Promise<ResultT>((resolve, reject) => {
    const postBody = JSON.stringify({ query, variables });

    const req = https.request(
      "https://graphql.buildkite.com/v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": postBody.length,
          Authorization: `Bearer ${process.env.BUILDKITE_TOKEN}`,
        },
      },
      res => {
        let respBody = "";

        // A chunk of data has been received.
        res.on("data", chunk => {
          respBody += chunk;
        });

        // The whole response has been received.
        res.on("end", () => {
          const result = JSON.parse(respBody);
          if (result.errors) {
            reject(result.errors[0]);
            return;
          }
          resolve(result.data);
        });
      }
    );

    req.on("error", e => reject(e));

    req.write(postBody);

    req.end();
  });
}

// apparently we wouldn't need this function (and could use the buildkite-agent cli directly) if
// we upgraded (there's `buildkite-agent build ...`?)
export async function fetchLatestChromiumBuildOnBranch(token, branch) {
  type VariablesType = {
    branch: string;
  }
  type ResultType = {
    pipeline: {
      builds: {
        edges: Array<{
          node: {
            uuid: string;
            number: number;
          };
        }>;
      };
    };
  };

  const result = await graphql<ResultType, VariablesType>(
    `
      query getLatestBuildIdOnBranch($branch: String!) {
        pipeline(slug: "replay/chromium-build") {
          builds(branch: [$branch], first: 1) {
            edges {
              node {
                uuid
                number
              }
            }
          }
        }
      }
    `,
    { branch }
  );

  const build = result.pipeline.builds.edges[0].node;
  return {
    buildId: build.uuid,
    buildNumber: build.number,
  };
}

export async function fetchRuntimeBuildIdFromChromiumBuildId(os, arch, buildId) {
  return fetchArtifactContents(buildId, path.join("build_id", os, arch, "build_id"));
}

export async function fetchRuntimeBuildIdFromChromiumBuildNumber(os, arch, buildNumber) {
  const pageSize = 25;

  // fetch the first page of builds
  type VariablesType = {
    pageSize: number;
    endCursor?: string;
  };
  type ResultType = {
    pipeline: {
      builds: {
        edges: Array<{
          node: {
            uuid: string;
            number: number;
          };
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };

  let result = await graphql<ResultType, VariablesType>(
    `
      query getBuilds($pageSize: Int!) {
        pipeline(slug: "replay/chromium-build") {
          builds(first: $pageSize) {
            edges {
              node {
                uuid
                number
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
    { pageSize }
  );

  let { hasNextPage, endCursor } = result.pipeline.builds.pageInfo;
  let builds = result.pipeline.builds.edges;
  do {
    for (const build of builds) {
      if (build.node.number === buildNumber) {
        return fetchRuntimeBuildIdFromChromiumBuildId(os, arch, build.node.uuid);
      }
    }

    if (hasNextPage) {
      result = await graphql<ResultType, VariablesType>(
        `
          query getBuilds($pageSize: Int!, $endCursor: String!) {
            pipeline(slug: "replay/chromium-build") {
              builds(first: $pageSize, after: $endCursor) {
                edges {
                  node {
                    uuid
                    number
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `,
        { pageSize, endCursor }
      );

      ({ hasNextPage, endCursor } = result.pipeline.builds.pageInfo);
      builds = result.pipeline.builds.edges;
    }
  } while (hasNextPage);

  throw new Error("did not find build number");
}

async function fetchArtifactContents(buildId, artifactPath) {
  execSync(`buildkite-agent artifact download ${artifactPath} . --build ` + buildId);

  return fs.readFileSync(artifactPath, "utf8").trim();
}

async function uploadArtifactContents(artifactPath, contents, contentType) {
  fs.writeFileSync(artifactPath, contents);
  execSync(
    `buildkite-agent artifact upload --content-type ${contentType} ${artifactPath}`
  );
}

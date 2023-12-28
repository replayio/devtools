import "@testing-library/jest-dom";
import { act, render as renderOriginal, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

import { TeamContext } from "../../TeamContextRoot";
import { TestRunsPage } from "./TestRunsPage";

jest.mock("next/router", () => jest.requireActual("next-router-mock"));
jest.mock(
  "react-virtualized-auto-sizer",
  () =>
    ({ children }: { children: (props: { height: number; width: number }) => JSX.Element }) =>
      children({ height: 600, width: 600 })
);

const graphQLMockOperations = {
  GetTestsRunsForWorkspace: {
    node: {
      id: "dzowNDAyOGMwYS05ZjM1LTQ2ZjktYTkwYi1jNzJkMTIzNzUxOTI=",
      testRuns: {
        edges: [
          {
            node: {
              id: "4137c38e-8186-4bb5-9ae4-9546576f473c",
              date: "2023-12-28T09:24:30.325Z",
              mode: null,
              results: {
                counts: {
                  failed: 1,
                  flaky: 3,
                  passed: 100,
                },
              },
              source: {
                commitId: "cc042b98ae11dec8360ed969078862fea447a24e",
                commitTitle: "Improve logic for showing test title and error (#10065)",
                groupLabel: "E2E Tests",
                isPrimaryBranch: true,
                branchName: "main",
                prNumber: null,
                prTitle: null,
                repository: "replayio/devtools",
                triggerUrl: "https://github.com/replayio/devtools/actions/runs/7346257707",
                user: "toshok",
              },
            },
          },
        ],
      },
    },
  },
  GetTestRunRecordings: {
    node: {
      id: "dzowNDAyOGMwYS05ZjM1LTQ2ZjktYTkwYi1jNzJkMTIzNzUxOTI=",
      testRuns: {
        edges: [
          {
            node: {
              id: "1e4d4c44-61ad-4858-9128-3b5474ec9a8b",
              date: "2023-12-28T15:31:13.556Z",
              mode: null,
              results: {
                counts: {
                  failed: 2,
                  flaky: 1,
                  passed: 101,
                },
              },
              source: {
                commitId: "da49afe7a826ff4afe1b6a91cba7e2d24a8dfca9",
                commitTitle: "Moved SupportForm (and ExternalLink) into replay-next",
                groupLabel: "E2E Tests",
                isPrimaryBranch: false,
                branchName: "FE-2115",
                prNumber: 10068,
                prTitle: "Fatal error dialog should include a contact form",
                repository: "replayio/devtools",
                triggerUrl: "https://github.com/replayio/devtools/actions/runs/7348983771",
                user: "bvaughn",
              },
              tests: [
                {
                  id: "dHJ0OjAxZjcwMGZhNzEyMmMyMTIyZmUxZTY3NmYyYjYwNTNiMzBjOGRmM2U=",
                  testId: "dHJ0OjAxZjcwMGZhNzEyMmMyMTIyZmUxZTY3NmYyYjYwNTNiMzBjOGRmM2U=",
                  title: "playwright-05: Test DOM node previews on user action step hover",
                  scope: [],
                  sourcePath: "tests/playwright-05_hover-dom-previews.test.ts",
                  result: "passed",
                  errors: [],
                  durationMs: 175633,
                  executions: [
                    {
                      result: "passed",
                      recordings: [
                        {
                          uuid: "b6a9c488-42b4-4773-8628-288c12fd44a4",
                          duration: 0,
                          isProcessed: false,
                          createdAt: "2023-12-28T15:35:13.488Z",
                          comments: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "dHJ0OjAyNjIwZjZhM2ZjMmI2YjhjYmFkZGY3YzhjYjIzOTgxOTE3YzMwMGM=",
                  testId: "dHJ0OjAyNjIwZjZhM2ZjMmI2YjhjYmFkZGY3YzhjYjIzOTgxOTE3YzMwMGM=",
                  title:
                    "focus_mode-01: should filter messages as regions based on the active focus mode",
                  scope: [],
                  sourcePath: "tests/focus_mode-01.test.ts",
                  result: "passed",
                  errors: [],
                  durationMs: 37007,
                  executions: [
                    {
                      result: "passed",
                      recordings: [
                        {
                          uuid: "36238418-9225-4f1b-8643-b96e2a0ff885",
                          duration: 0,
                          isProcessed: false,
                          createdAt: "2023-12-28T15:34:09.787Z",
                          comments: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "dHJ0OjAzODBmMDk4YmE1ODUxZTBmY2U2ZmFiYTQyNzJmYjFlZDFiZGNhYWM=",
                  testId: "dHJ0OjAzODBmMDk4YmE1ODUxZTBmY2U2ZmFiYTQyNzJmYjFlZDFiZGNhYWM=",
                  title:
                    "breakpoints-03: Test stepping forward through breakpoints when rewound before the first one",
                  scope: [],
                  sourcePath: "tests/breakpoints-03.test.ts",
                  result: "passed",
                  errors: [],
                  durationMs: 146012,
                  executions: [
                    {
                      result: "passed",
                      recordings: [
                        {
                          uuid: "065c65b1-6d74-48f9-bed1-51d428c4ac19",
                          duration: 0,
                          isProcessed: false,
                          createdAt: "2023-12-28T15:34:42.897Z",
                          comments: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  },
};

beforeAll(() => {
  // @ts-ignore
  fetch = jest.fn(async (url, options) => {
    if (!options) {
      throw new Error("No options provided");
    }

    const { operationName } = JSON.parse(options.body) as {
      operationName: string;
    };

    if (!Object.keys(graphQLMockOperations).includes(operationName)) {
      throw new Error(`No mock found for ${operationName}`);
    }

    return {
      ok: true,
      json: async () => ({
        data: graphQLMockOperations[operationName as keyof typeof graphQLMockOperations],
      }),
    };
  });
});

const render = (children: ReactNode) => {
  renderOriginal(<TeamContext.Provider value={{ teamId: "" }}>{children}</TeamContext.Provider>);
};

test("test run exists", async () => {
  act(() => render(<TestRunsPage />));

  await waitFor(() => screen.getByText("Improve logic for showing test title and error (#10065)"));
});

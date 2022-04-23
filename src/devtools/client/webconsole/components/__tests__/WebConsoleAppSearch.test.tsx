import { readFileSync } from "fs";
import { join } from "path";

import userEvent from "@testing-library/user-event";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import { ThreadFront } from "protocol/thread";
import React from "react";
import { render, createTestStore, filterCommonTestWarnings, screen } from "test/testUtils";
import { UIStore } from "ui/actions";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

useRouter.mockImplementation(() => ({
  asPath: "/recording/abcd",
  query: { id: "abcd" },
}));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("WebConsoleApp search", () => {
  filterCommonTestWarnings();

  let store: UIStore = null as unknown as UIStore;

  beforeEach(async () => {
    // TODO This is side effectful in a way that affects ThreadFront.setSessionId(); we should clean that up!
    store = await createTestStore();

    // TODO Replace this with a utilty function; this is not the right session ID.
    // This is necessary to unblock various event listeners and parsing.
    // Actual session ID value _probably_ doesn't matter here
    await ThreadFront.setSessionId("fake");

    const fixtureData = JSON.parse(
      readFileSync(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "..",
          "..",
          "public",
          "test",
          "fixtures",
          "console_messages.js.json"
        ),
        "utf8"
      )
    );

    // Initialize state using exported websocket messages,
    // sent through the mock environment straight to socket parsing
    fixtureData.forEach((message: any) => {
      window.mockEnvironment?.sendSocketMessage(JSON.stringify(message));
    });

    // Give everything time to settle
    await sleep(100);
  });

  it("Can search for console messages", async () => {
    const { findByPlaceholderText, findByRole, findByText, findByTitle } = await render(
      <WebConsoleApp />,
      {
        store,
      }
    );

    // Focus within the Console component.
    const filterInput = await findByPlaceholderText("Filter Output");
    await userEvent.type(filterInput, "{Meta>}f");

    // Open the search input.
    const searchInput = await findByPlaceholderText("Find string in logs");

    // Search for a string that will match multiple rows and step through them
    await userEvent.type(searchInput, "Iteration 1");
    expect(await findByText("1 of 2 results")).toBeInTheDocument();
    const nextButton = await findByTitle("Next result");
    await userEvent.click(nextButton);
    expect(await findByText("2 of 2 results")).toBeInTheDocument();

    // Refine results so there's only 1 match
    await userEvent.type(searchInput, "0");
    expect(await findByText("1 result")).toBeInTheDocument();

    // Refine results so there aren't any matches
    await userEvent.type(searchInput, "0");
    expect(await findByText("No results found")).toBeInTheDocument();

    // Hide the search input
    await userEvent.type(searchInput, "{Escape}");
    expect(await screen.queryByPlaceholderText("Find string in logs")).not.toBeInTheDocument();
  });
});

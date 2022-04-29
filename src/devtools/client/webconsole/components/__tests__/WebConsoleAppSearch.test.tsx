import userEvent from "@testing-library/user-event";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import React from "react";
import { loadFixtureData } from "test/testFixtureUtils";
import { render, filterCommonTestWarnings, screen } from "test/testUtils";
import { UIStore } from "ui/actions";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

useRouter.mockImplementation(() => ({
  asPath: "/recording/abcd",
  query: { id: "abcd" },
}));

describe("WebConsoleApp search", () => {
  filterCommonTestWarnings();

  let store: UIStore = null as unknown as UIStore;

  beforeEach(async () => {
    store = (await loadFixtureData("console_messages")).store;
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

import React from "react";
import { render, createTestStore, filterCommonTestWarnings, act, screen } from "test/testUtils";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import { createSession } from "ui/actions/session";
import { ThreadFront } from "protocol/thread";

import { websocketMessages } from "./fixtures/messageSetupActions";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

useRouter.mockImplementation(() => ({
  query: { id: "abcd" },
  asPath: "/recording/abcd",
}));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("Web Console UI", () => {
  filterCommonTestWarnings();

  it("Can render a list of messages and filter it", async () => {
    const store = await createTestStore();
    // This is necessary to unblock various event listeners and parsing.
    // Actual session ID value _probably_ doesn't matter here
    await ThreadFront.setSessionId("1e3e916b-7725-4f7f-9f2e-07088f4a0b9d");

    // Initialize state using exported websocket messages,
    // sent through the mock environment straight to socket parsing
    websocketMessages.forEach(message => {
      window.mockEnvironment?.sendSocketMessage(message.data);
    });

    // Give everything time to settle
    await sleep(100);

    const { findByText, findByPlaceholderText, findByRole } = await render(<WebConsoleApp />, {
      store,
    });

    const timestampsCheckbox = await findByText("Show Timestamps");
    expect(timestampsCheckbox).toBeInTheDocument();

    const getListItems = () =>
      Array.from(document.querySelectorAll(".cm-s-mozilla.message") ?? { length: 0 });

    const { messages } = store.getState();

    // Verify we actually have rendered list items in the UI
    const loadedListItems = getListItems();
    expect(loadedListItems.length).toBeGreaterThan(0);
    expect(loadedListItems.length).toBe(messages.messages.ids.length);

    // Should have this specific list item as a confirmation
    const messageEntry = await findByText("2. Mousing over a line number");
    expect(messageEntry).toBeInTheDocument();

    const filterInput = await findByPlaceholderText("Filter Output");

    // There are five message with "circle" in the description. Filter by text.
    await userEvent.type(filterInput, "cir");

    const filteredListItems = getListItems();
    expect(filteredListItems.length).toBe(5);

    // Clear out the text filter
    const clearTextButton = await findByRole("button", { name: "close" });
    await userEvent.click(clearTextButton);

    const loadedListItems2 = getListItems();
    expect(loadedListItems2.length).toBe(loadedListItems.length);

    // Toggle the "Logs" filter option on and off
    const logsCheckbox = await findByRole("checkbox", {
      name: /^Logs/,
    });

    await userEvent.click(logsCheckbox);

    const filteredListItems2 = getListItems();
    expect(filteredListItems2.length).toBe(0);

    await userEvent.click(logsCheckbox);

    const loadedListItems3 = getListItems();
    expect(loadedListItems3.length).toBe(loadedListItems.length);
  }, 20000);
});

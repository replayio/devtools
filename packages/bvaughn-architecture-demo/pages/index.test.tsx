import { screen } from "@testing-library/react";
import { createConsoleMessage } from "shared/utils/testing";

import { setupWindow } from "../src/utils/testing";

import { render } from "../src/utils/testing";

import HomePage from "./index";

describe("MessageList", () => {
  beforeEach(() => {
    setupWindow();
  });

  it("should render the console app", async () => {
    await render(<HomePage />, {
      replayClient: {
        findMessages: async () =>
          Promise.resolve({
            messages: [
              createConsoleMessage({
                text: "This is a message",
              })[1],
            ],
            overflow: true,
          }),
      },
    });

    // Verify that our message was rendered.
    expect(screen.getByText("This is a message")).toBeInTheDocument();

    // Basic message filters
    expect(screen.getByRole("checkbox", { name: "Errors?" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Logs?" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Warnings?" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter output")).toBeInTheDocument();

    // // Basic focus range UI should be rendered
    expect(await screen.queryByText("Focus off")).toBeInTheDocument();
    expect(await screen.queryByText("0:00 – 0:01")).toBeInTheDocument();
  });
});

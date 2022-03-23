import React from "react";
import { render, createTestStore } from "test/testUtils";

import WebConsoleApp from "devtools/client/webconsole/components/App";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

useRouter.mockImplementationOnce(() => ({
  query: { id: "abcd" },
  asPath: "/recording/abcd",
}));

describe("Web Console UI", () => {
  it("Renders the Web Console UI without exploding", async () => {
    const { findByText } = await render(<WebConsoleApp />);

    const timestampsCheckbox = await findByText("Show Timestamps");
    expect(timestampsCheckbox).toBeInTheDocument();
  });
});

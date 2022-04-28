import userEvent from "@testing-library/user-event";
import React from "react";
import { act } from "react-dom/test-utils";
import { loadFixtureData } from "test/testFixtureUtils";
import { render, filterCommonTestWarnings, screen } from "test/testUtils";
import { UIStore } from "ui/actions";
import { setLoadingFinished, setModal } from "ui/actions/app";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

const FAKE_RECORDING_ID = "mock-recording";

useRouter.mockImplementation(() => ({
  asPath: `/recording/${FAKE_RECORDING_ID}`,
  query: { id: FAKE_RECORDING_ID },
}));

describe("AppModal", () => {
  filterCommonTestWarnings();

  let store: UIStore = null as unknown as UIStore;

  beforeEach(async () => {
    store = await loadFixtureData("console_messages");

    // TODO Seems better if we didn't have to fake this
    store.dispatch(setLoadingFinished(true));
  });

  it("Escape key should dismiss the app modal", async () => {
    // HACK It's easier to mock the inner Privacy modal component
    // than to mock all of the Apollo query responses.
    jest.mock("ui/components/UploadScreen/Privacy", () => ({
      Privacy: function MockPrivacy() {
        console.log("<MockPrivacy>");
        return "Privacy mock component";
      },
    }));

    const App = require("ui/components/App").default;
    const { findByText } = await render(<App />, {
      store,
    });

    // Show the Privacy modal because it's the simplest and requires the least mocking/stubbing
    store.dispatch(setModal("privacy", { recordingId: FAKE_RECORDING_ID }));

    // Verify modal is visible
    await findByText("Privacy mock component");

    // Press the "Escape" key
    await userEvent.type(document.body, "{Escape}");

    // Verify the modal is hidden
    expect(await screen.queryByText("Privacy mock component")).not.toBeInTheDocument();
  });
});

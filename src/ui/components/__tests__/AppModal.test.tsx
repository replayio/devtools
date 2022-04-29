import userEvent from "@testing-library/user-event";
import React from "react";
import { loadFixtureData } from "test/testFixtureUtils";
import { render, filterCommonTestWarnings, screen } from "test/testUtils";
import { UIStore } from "ui/actions";
import { setLoadingFinished, setModal } from "ui/actions/app";
import { Recording } from "ui/types";
import { getRecordingURL } from "ui/utils/recording";

const useRouter = jest.spyOn(require("next/router"), "useRouter");

describe("AppModal", () => {
  filterCommonTestWarnings();

  let graphqlMocks: any[] = null as unknown as any[];
  let recording: Recording = null as unknown as Recording;
  let store: UIStore = null as unknown as UIStore;

  beforeEach(async () => {
    const response = await loadFixtureData("console_messages");
    graphqlMocks = response.graphqlMocks;
    recording = response.recording;
    store = response.store;

    const url = getRecordingURL(recording);
    global.location.pathname = url;
    useRouter.mockImplementation(() => ({
      asPath: url,
      pathname: url,
      query: { id: recording.id },
    }));

    // TODO Seems better if we didn't have to fake this
    store.dispatch(setLoadingFinished(true));
  });

  it("Escape key should dismiss the app modal", async () => {
    const App = require("ui/components/App").default;
    const { findByText } = await render(<App />, {
      graphqlMocks,
      store,
    });

    // Show the Privacy modal because it's the simplest and requires the least mocking/stubbing
    store.dispatch(setModal("privacy", { recordingId: recording.id }));

    // Verify modal is visible
    await findByText("Privacy");

    // Press the "Escape" key
    await userEvent.type(document.body, "{Escape}");

    // Verify the modal is hidden
    expect(await screen.queryByText("Privacy")).not.toBeInTheDocument();
  });
});

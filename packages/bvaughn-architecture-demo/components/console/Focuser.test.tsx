import { fireEvent, screen } from "@testing-library/react";

import { renderFocused } from "../../src/utils/testing";

import Focuser from "./Focuser";

describe("Focuser", () => {
  it("should render the with no focus region", async () => {
    await renderFocused(<Focuser />, {
      focusContext: {
        range: null,
        rangeForDisplay: null,
      },
      sessionContext: {
        duration: 60_000,
      },
    });

    expect(await screen.queryByText("Focus off")).toBeInTheDocument();
    expect(await screen.queryByText("0:00 – 1:00")).toBeInTheDocument();
  });

  it("should render the current focus region", async () => {
    await renderFocused(<Focuser />, {
      focusContext: {
        range: [0, 30_000],
        rangeForDisplay: [0, 30_000],
      },
      sessionContext: {
        duration: 60_000,
      },
    });

    expect(await screen.queryByText("Focus on")).toBeInTheDocument();
    expect(await screen.queryByText("0:00 – 0:30")).toBeInTheDocument();
  });

  it("should allow the focus region to be toggled on and off", async () => {
    const {
      focusContext: { update },
    } = await renderFocused(<Focuser />, {
      focusContext: {
        range: null,
        rangeForDisplay: null,
      },
      sessionContext: {
        duration: 60_000,
      },
    });

    expect(update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Focus off"));

    expect(update).toHaveBeenCalledWith([0, 60_000], false);
  });
});

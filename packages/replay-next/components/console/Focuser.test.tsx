import { fireEvent, screen } from "@testing-library/react";

import { renderFocused } from "replay-next/src/utils/testing";

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

    await expect(await screen.queryByText("Focus off")).toBeInTheDocument();
    await expect(await screen.queryByText("0:00 – 1:00")).toBeInTheDocument();
  });

  it("should render the current focus region", async () => {
    await renderFocused(<Focuser />, {
      focusContext: {
        range: {
          begin: {
            point: "0",
            time: 0,
          },
          end: {
            time: 30_000,
            point: "30000",
          },
        },
        rangeForDisplay: {
          begin: {
            point: "0",
            time: 0,
          },
          end: {
            time: 30_000,
            point: "30000",
          },
        },
      },
      sessionContext: {
        duration: 60_000,
      },
    });

    await expect(await screen.queryByText("Focus on")).toBeInTheDocument();
    await expect(await screen.queryByText("0:00 – 0:30")).toBeInTheDocument();
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

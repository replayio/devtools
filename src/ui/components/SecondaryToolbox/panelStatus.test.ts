import {
  calculateProcessorPanelStatus,
  calculateRoutinePanelStatus,
} from "ui/components/SecondaryToolbox/panelStatus";

describe("calculateProcessorPanelStatus", () => {
  test.each([
    ["notApplicable", "not-available"],
    ["pending", "pending"],
    ["ready", "loaded"],
    ["failed", "failed"],
  ] as const)("maps library status %s to %s", (libraryStatus, expected) => {
    for (const hasInitialAnnotations of [true, false]) {
      expect(
        calculateProcessorPanelStatus({
          libraryStatus,
          requestFailed: false,
          hasInitialAnnotations,
        })
      ).toBe(expected);
    }
  });

  test("shows the tab as pending while the library status is outstanding", () => {
    expect(
      calculateProcessorPanelStatus({
        libraryStatus: undefined,
        requestFailed: false,
        hasInitialAnnotations: true,
      })
    ).toBe("pending");
  });

  test("shows the tab as failed when the library status request fails", () => {
    expect(
      calculateProcessorPanelStatus({
        libraryStatus: undefined,
        requestFailed: true,
        hasInitialAnnotations: true,
      })
    ).toBe("failed");
  });

  test("hides the tab without setup annotations until the library status arrives", () => {
    for (const requestFailed of [true, false]) {
      expect(
        calculateProcessorPanelStatus({
          libraryStatus: undefined,
          requestFailed,
          hasInitialAnnotations: false,
        })
      ).toBe("not-available");
    }
  });
});

describe("calculateRoutinePanelStatus", () => {
  test("is loaded when routine annotations exist", () => {
    expect(calculateRoutinePanelStatus(true, false, true)).toBe("loaded");
  });

  test("uses the setup annotations when routine annotations are missing", () => {
    expect(calculateRoutinePanelStatus(false, true, false)).toBe("pending");
    expect(calculateRoutinePanelStatus(false, true, true)).toBe("recording-too-long");
    expect(calculateRoutinePanelStatus(false, false, false)).toBe("not-available");
  });
});

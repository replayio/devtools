import { LibraryPanelStatus } from "@replayio/protocol";

export type RoutinePanelStatus =
  | "pending"
  | "loaded"
  | "not-available"
  | "recording-too-long"
  | "failed";

export function calculateRoutinePanelStatus(
  hasRoutineAnnotations: boolean,
  hasInitialAnnotations: boolean,
  recordingTooLongForRoutines: boolean
): RoutinePanelStatus {
  // We definitely show these tabs if we have actual annotations from the routine.
  // If we don't have routine annotations, we want to show the tabs anyway _if_ the recording
  // is too long, in which case the panels will show a warning message describing why.
  // Also, we should only show these tabs if we're pretty sure the recording actually has
  // _some_ kind of React or Redux data available (ie, not a Vue or Angular app).
  if (hasRoutineAnnotations) {
    return "loaded";
  } else if (hasInitialAnnotations) {
    // Controller sessions have no way to report routine failures, so there is no error state.

    // We'll never hit this case for Firefox recordings,
    // because we don't have the "initial" annotations from the recording.
    return recordingTooLongForRoutines ? "recording-too-long" : "pending";
  } else {
    return "not-available";
  }
}

// Session.getLibraryStatus can take minutes to answer. Until it does (or if it fails),
// fall back to the setup annotations the recording itself contains to decide whether
// the tab is worth showing.
export function calculateProcessorPanelStatus({
  libraryStatus,
  requestFailed,
  hasInitialAnnotations,
}: {
  libraryStatus: LibraryPanelStatus | undefined;
  requestFailed: boolean;
  hasInitialAnnotations: boolean;
}): RoutinePanelStatus {
  switch (libraryStatus) {
    case "notApplicable":
      return "not-available";
    case "pending":
      return "pending";
    case "ready":
      return "loaded";
    case "failed":
      return "failed";
    case undefined:
      if (!hasInitialAnnotations) {
        return "not-available";
      }
      return requestFailed ? "failed" : "pending";
  }
}

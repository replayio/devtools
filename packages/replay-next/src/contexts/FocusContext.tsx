import { FocusWindowRequestBias, TimeStampedPointRange } from "@replayio/protocol";
import { createContext } from "react";

import { TimeRange as TimeRangeArray } from "../types";

interface TimeRange {
  begin: number;
  end: number;
}

export type UpdateOptions = {
  bias?: FocusWindowRequestBias;
  sync: boolean;
};

export type FocusContextType = {
  // Focus is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  enterFocusMode: () => void;
  isTransitionPending: boolean;

  // The currently active range - use this for backend requests that don't cause components to suspend
  range: TimeStampedPointRange | null;
  // The range to be displayed in the Timeline - don't use this for backend requests
  rangeForDisplay: TimeRange | null;
  // The deferred value of the currently active range - use this for backend requests that may cause components to suspend
  rangeForSuspense: TimeStampedPointRange | null;

  // Set focus window to a range of execution points.
  update: (value: TimeStampedPointRange, options: UpdateOptions) => Promise<void>;

  // Set focus window to a range of times.
  // Note this value is imprecise and should only be used by the Timeline focuser UI.
  updateForTimelineImprecise: (
    value: TimeRangeArray | null,
    options: UpdateOptions
  ) => Promise<void>;
};

export const FocusContext = createContext<FocusContextType>(null as any);

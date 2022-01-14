import { Breakpoint } from "devtools/client/debugger/src/reducers/breakpoints";
import React from "react";
import { useSelector } from "react-redux";
import Warning from "ui/components/shared/Warning";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { prefs } from "ui/utils/prefs";

type Warning = { text: string; link: string };
const WARNINGS: Record<string, Warning> = {
  // Need to add this as a follow up. Right now we're not enforcing this check yet.
  // editingDisabled: {
  //   text: "Log editing for this line is disabled because it has too many hits",
  //   link: "test",
  // },
  printingDisabled: {
    text: "Logs for this line are disabled because it has too many hits",
    link: "https://www.notion.so/replayio/Debugger-Limitations-5b33bb0e5bd1459cbd7daf3234219c27#1e6ed519f3f849458a7aa88b7be497b6",
  },
};

function useGetHits(breakpoint: Breakpoint) {
  const points = useSelector((state: UIState) =>
    selectors.getAnalysisPointsForLocation(state, breakpoint.location, breakpoint.options.condition)
  );

  return points?.length || 0;
}

function useGetWarning(breakpoint: Breakpoint) {
  const hitsCount = useGetHits(breakpoint);

  if (hitsCount > prefs.maxHitsDisplayed) {
    return WARNINGS.printingDisabled;
  }

  return null;
}

export default function HitsWarning({ breakpoint }: { breakpoint: Breakpoint }) {
  const warning = useGetWarning(breakpoint);

  if (!warning) {
    return null;
  }

  return <Warning link={warning.link}>{warning.text}</Warning>;
}

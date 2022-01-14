import { Breakpoint } from "devtools/client/debugger/src/reducers/breakpoints";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { prefs } from "ui/utils/prefs";

const msg = [
  "Log editing is disabled because this line has too many hits",
  "Logs are disabled because this line has too many hits",
];

type Warning = { text: string; link: string };
const WARNINGS: Record<string, Warning> = {
  editingDisabled: {
    text: "Log editing for this line is disabled because it has too many hits",
    link: "test",
  },
  printingDisabled: {
    text: "Logs for this line are disabled because it has too many hits",
    link: "test",
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
  } else if (hitsCount > prefs.maxHitsEditable) {
    return WARNINGS.editingDisabled;
  }

  return null;
}

export default function Warning({ breakpoint }: { breakpoint: Breakpoint }) {
  const [hidden, setHidden] = useState(false);
  const warning = useGetWarning(breakpoint);

  if (!warning || hidden) {
    return null;
  }

  const { text, link } = warning;

  return (
    <div className="bg-red-100 text-red-700 py-1 px-2 flex flex-col leading-tight font-sans">
      <div className="flex space-x-1 items-center">
        <MaterialIcon>error</MaterialIcon>
        <span className="whitespace-pre overflow-ellipsis overflow-hidden flex-grow">{text}</span>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer noopener">
            <span className="whitespace-pre underline">Read more</span>
          </a>
        ) : null}
        <button className="underline" onClick={() => setHidden(true)}>
          Hide
        </button>
      </div>
    </div>
  );
}

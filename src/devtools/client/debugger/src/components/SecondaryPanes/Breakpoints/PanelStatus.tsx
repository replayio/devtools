import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import sortedLastIndex from "lodash/sortedLastIndex";
import { AnalysisError } from "protocol/thread/analysis";
import { useSelector } from "react-redux";
import { getPrefixBadgeBackgroundColorClassName } from "ui/components/PrefixBadge";
import { getIsIndexed } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { AnalysisPayload } from "ui/state/app";

const numberStatus = (current: number, total: number): string => {
  return `${current}/${total}`;
};

const maxStatusLength = (total: number): number => {
  const numberLength = numberStatus(total, total).length;
  return Math.max("Loading".length, numberLength);
};

export function PanelStatus({
  analysisPoints,
  prefixBadge,
}: {
  analysisPoints: AnalysisPayload;
  prefixBadge: PrefixBadge;
}) {
  const isIndexed = useSelector(getIsIndexed);
  const time = useSelector(getCurrentTime);
  let status = "";

  const points = analysisPoints?.data;
  const error = analysisPoints?.error;

  if (!isIndexed || !analysisPoints) {
    status = "Loading";
  } else if (error) {
    status = (error as AnalysisError) === AnalysisError.TooManyPointsToFind ? "10k+ hits" : "Error";
  } else if (points?.length == 0) {
    status = "No hits";
  } else {
    const previousTimeIndex = sortedLastIndex(
      points?.map(p => p.time),
      time
    );
    status = numberStatus(previousTimeIndex, points?.length || 0);
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div
        className={`rounded-2xl bg-breakpointStatusBG px-3 py-0.5 text-breakpointStatus ${getPrefixBadgeBackgroundColorClassName(
          prefixBadge
        )}`}
      >
        <div
          className="text-center"
          style={{ width: `${maxStatusLength(points?.length || 0)}ch` }}
        ></div>
        {status}
      </div>
    </div>
  );
}

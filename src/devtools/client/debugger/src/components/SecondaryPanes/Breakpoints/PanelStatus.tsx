import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import sortedLastIndex from "lodash/sortedLastIndex";
import { AnalysisError } from "protocol/thread/analysis";
import { useAppSelector } from "ui/setup/hooks";
import { getPrefixBadgeBackgroundColorClassName } from "ui/components/PrefixBadge";
import { getCurrentTime } from "ui/reducers/timeline";
import { AnalysisStatus, LocationAnalysisSummary } from "ui/reducers/breakpoints";

const numberStatus = (current: number | undefined, total: number | undefined): string => {
  return `${current ?? "?"}/${total ?? "?"}`;
};

const maxStatusLength = (total: number | undefined): number => {
  const numberLength = numberStatus(total, total).length;
  return Math.max("Loading".length, numberLength);
};

export function PanelStatus({
  analysisPoints,
  prefixBadge,
}: {
  analysisPoints?: LocationAnalysisSummary;
  prefixBadge: PrefixBadge;
}) {
  const time = useAppSelector(getCurrentTime);
  let status = "";

  const points = analysisPoints?.data;
  const error = analysisPoints?.error;
  const runningStatus = analysisPoints?.status;

  if (
    !points ||
    [AnalysisStatus.LoadingPoints, AnalysisStatus.LoadingResults].includes(runningStatus!)
  ) {
    status = "Loading";
  } else if (error) {
    if (error === AnalysisError.TooManyPointsToFind) {
      status = "10k+ hits";
    } else if (error === AnalysisError.Unknown) {
      status = "Error";
    }
  } else if (points.length == 0) {
    status = "No hits";
  } else {
    const previousTimeIndex = sortedLastIndex(
      points.map(p => p.time),
      time
    );
    status = numberStatus(previousTimeIndex, points.length);
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
          style={{ width: `${maxStatusLength(points?.length)}ch` }}
        ></div>
        {status}
      </div>
    </div>
  );
}

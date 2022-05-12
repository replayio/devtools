import sortedLastIndex from "lodash/sortedLastIndex";
import { useSelector } from "react-redux";
import styles from "ui/components/PrefixBadge.module.css";
import { getIsIndexed, getTheme } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { AnalysisError, AnalysisPayload } from "ui/state/app";

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
  prefixBadge: string;
}) {
  const isIndexed = useSelector(getIsIndexed);
  const theme = useSelector(getTheme);
  const time = useSelector(getCurrentTime);
  let status = "";

  if (!isIndexed || !analysisPoints) {
    status = "Loading";
  } else if (analysisPoints.error) {
    status = analysisPoints.error === AnalysisError.TooManyPoints ? "10k+ hits" : "Error";
  } else if (analysisPoints.data.length == 0) {
    status = "No hits";
  } else {
    const previousTimeIndex = sortedLastIndex(
      analysisPoints.data.map(p => p.time),
      time
    );
    status = numberStatus(previousTimeIndex, analysisPoints.data.length);
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div
        className={`rounded-2xl bg-breakpointStatusBG px-3 py-0.5 text-breakpointStatus 
      ${prefixBadge === "unicorn" || prefixBadge === "empty" ? "" : styles[prefixBadge]}
      `}
      >
        <div
          className="text-center"
          style={{ width: `${maxStatusLength(analysisPoints?.data.length || 0)}ch` }}
        ></div>
        {status}
      </div>
    </div>
  );
}

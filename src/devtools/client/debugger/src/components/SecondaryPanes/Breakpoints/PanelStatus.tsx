import { useSelector } from "react-redux";
import { isColorPrefix } from "ui/components/PrefixBadge";
import { getIsIndexed, getTheme } from "ui/reducers/app";
import { AnalysisError, AnalysisPayload } from "ui/state/app";
import { getExecutionPoint } from "../../../selectors";
import styles from "ui/components/PrefixBadge.module.css";

export function PanelStatus({
  analysisPoints,
  prefixBadge,
}: {
  analysisPoints: AnalysisPayload;
  prefixBadge: string;
}) {
  const executionPoint = useSelector(getExecutionPoint);
  const isIndexed = useSelector(getIsIndexed);
  const theme = useSelector(getTheme);
  let status = "";
  let maxStatusLength = 0;

  if (!isIndexed) {
    status = "Indexing";
  } else if (!analysisPoints || !executionPoint) {
    status = "Loading";
  } else if (analysisPoints.error) {
    status = analysisPoints.error === AnalysisError.TooManyPoints ? "10k+ hits" : "Error";
  } else if (analysisPoints.data.length == 0) {
    status = "No hits";
  } else {
    const points = analysisPoints
      ? analysisPoints.data.filter(point => BigInt(point.point) <= BigInt(executionPoint))
      : [];

    status = `${points.length}/${analysisPoints.data.length}`;
    maxStatusLength = `${analysisPoints.data.length}/${analysisPoints.data.length}`.length;
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div
        className={`rounded-2xl bg-breakpointStatusBG px-3 py-0.5 text-breakpointStatus ${styles[prefixBadge]}`}
      >
        <div className="text-center" style={{ minWidth: `${maxStatusLength}ch` }}></div>
        {status}
      </div>
    </div>
  );
}

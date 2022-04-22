import { useSelector } from "react-redux";
import { getIsIndexed } from "ui/reducers/app";
import { AnalysisError, AnalysisPayload } from "ui/state/app";
import { getExecutionPoint } from "../../../selectors";

const getPreviousPointsCount = (analysisPoints: AnalysisPayload, executionPoint: string | null) => {
  if (!executionPoint) {
    return "…";
  }

  const previousPoints = analysisPoints.data.filter(
    point => BigInt(point.point) <= BigInt(executionPoint)
  );
  return previousPoints.length;
};

export function PanelStatus({ analysisPoints }: { analysisPoints: AnalysisPayload }) {
  const executionPoint = useSelector(getExecutionPoint);
  const isIndexed = useSelector(getIsIndexed);
  let status = "";
  let maxStatusLength = 0;

  if (!isIndexed) {
    status = "Indexing";
  } else if (!analysisPoints) {
    status = "Loading";
  } else if (analysisPoints.error) {
    status = analysisPoints.error === AnalysisError.TooManyPoints ? "10k+ hits" : "Error";
  } else if (analysisPoints.data.length == 0) {
    status = "No hits";
  } else {
    const pointsCount = getPreviousPointsCount(analysisPoints, executionPoint);

    status = `${pointsCount}/${analysisPoints.data.length}`;
    maxStatusLength = `${analysisPoints.data.length}/${analysisPoints.data.length}`.length;
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div className="text-breakpointStatus rounded-2xl bg-breakpointStatusBG px-3 py-0.5">
        <div className="text-center" style={{ minWidth: `${maxStatusLength}ch` }}></div>
        {status}
      </div>
    </div>
  );
}

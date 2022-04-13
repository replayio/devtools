import { useContext } from "react";
import { useSelector } from "react-redux";
import { getIsIndexed } from "ui/reducers/app";
import { AnalysisPayload } from "ui/state/app";
import { getExecutionPoint } from "../../../selectors";
import { HitsContext } from "../../Editor/Breakpoints/Panel/Panel";

const createStatusString = (
  hits: number | null,
  executionPoint: string | null,
  analysisPoints: AnalysisPayload
) => {
  const denominator = hits;
  let numerator = "…";

  if (analysisPoints && executionPoint) {
    numerator =
      "" +
      analysisPoints.data.reduce(
        (acc, point) => (BigInt(point.point) <= BigInt(executionPoint) ? acc + 1 : acc),
        0
      );
  }

  return `${numerator}/${denominator}`;
};

export function PanelStatus({ analysisPoints }: { analysisPoints: AnalysisPayload }) {
  const isIndexed = useSelector(getIsIndexed);
  const { error, loading, hits } = useContext(HitsContext);
  const executionPoint = useSelector(getExecutionPoint);

  let status: string | HTMLDivElement = "…";
  let maxCharLength = 0;

  if (!isIndexed) {
    status = "Indexing";
  } else if (error) {
    status = "Error";
  } else if (loading) {
    status = "Loading";
  } else if (hits === 0) {
    status = "No hits";
  } else if (hits) {
    // This number will be used to figure out the max character length we will
    // have to accommodate for this status component, so that we can set its minimum
    // width to it and minimize layout shifting.
    maxCharLength = `${hits}/${hits}`.length;
    status = createStatusString(hits, executionPoint, analysisPoints);
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div className="text-breakpointStatus rounded-2xl bg-breakpointStatusBG px-3 py-0.5">
        <div className="text-center" style={{ minWidth: `${maxCharLength}ch` }}></div>
        {status}
      </div>
    </div>
  );
}

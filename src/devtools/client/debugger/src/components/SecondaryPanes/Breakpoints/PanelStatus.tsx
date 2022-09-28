import { TimeStampedPoint } from "@replayio/protocol";
import { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import sortedLastIndex from "lodash/sortedLastIndex";
import { HitPointStatus } from "shared/client/types";
import { getPrefixBadgeBackgroundColorClassName } from "ui/components/PrefixBadge";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

const numberStatus = (current: number | undefined, total: number | undefined): string => {
  return `${current ?? "?"}/${total ?? "?"}`;
};

const maxStatusLength = (total: number | undefined): number => {
  const numberLength = numberStatus(total, total).length;
  return Math.max("Loading".length, numberLength);
};

export function PanelStatus({
  hitPoints,
  hitPointStatus,
  prefixBadge,
}: {
  hitPoints: TimeStampedPoint[] | null;
  hitPointStatus: HitPointStatus | null;
  prefixBadge: PrefixBadge;
}) {
  const time = useAppSelector(getCurrentTime);
  const hitPointsLength = hitPoints === null ? 0 : hitPoints.length;

  let status = null;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
      status = "10k+ hits";
      break;
    case "too-many-points-to-run-analysis":
      break;
    default:
      if (hitPoints === null) {
        status = "Loading";
      } else if (hitPointsLength === 0) {
        status = "No hits";
      } else {
        const previousTimeIndex = sortedLastIndex(
          hitPoints!.map(p => p.time),
          time
        );
        status = numberStatus(previousTimeIndex, hitPointsLength);
      }
      break;
  }

  return (
    <div className="breakpoint-navigation-status-container">
      <div
        className={`rounded-2xl bg-breakpointStatusBG px-3 py-0.5 text-breakpointStatus ${getPrefixBadgeBackgroundColorClassName(
          prefixBadge
        )}`}
        data-test-name="LogpointPanel-BreakpointStatus"
      >
        <div
          className="text-center"
          style={{ width: `${maxStatusLength(hitPointsLength)}ch` }}
        ></div>
        {status}
      </div>
    </div>
  );
}

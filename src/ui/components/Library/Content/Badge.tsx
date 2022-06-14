import { Recording } from "ui/types";

const badgeStyles = {
  passing: "bg-gray-100 text-gray-400 rounded-md",
  flakey: "bg-yellow-200 text-yellow-600 rounded-full",
  failing: "bg-red-400 text-red-100 rounded-full",
};

const hasFailed = (recording: Recording) => recording.metadata.test?.result !== "passed";

export default function SummaryBadge({ recordings }: { recordings: Recording[] }) {
  const failCount = recordings.filter(hasFailed).length;
  const isFailing = recordings.slice(0, 5).filter(hasFailed).length == 5;
  const status = failCount == 0 ? "passing" : isFailing ? "failing" : "flakey";

  return (
    <div
      className={`${badgeStyles[status]} grid h-8 w-8  items-center justify-center  text-xs font-medium `}
    >
      {failCount}
    </div>
  );
}

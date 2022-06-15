import { Recording } from "ui/types";

export default function SummaryBadge({ recordings }: { recordings: Recording[] }) {
  const failCount = recordings.filter(r => r.metadata.test?.result !== "passed").length;

  return (
    <div className="grid items-center justify-center w-8 h-8 font-medium text-red-700 bg-gray-300 rounded-md">
      {failCount}
    </div>
  );
}

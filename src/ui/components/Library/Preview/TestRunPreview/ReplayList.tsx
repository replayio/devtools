import { orderBy } from "lodash";
import { Recording } from "ui/types";
import { ReplayRow } from "./ReplayRow";

export function ReplayList({ recordings }: { recordings: Recording[] }) {
  return (
    <div className="flex flex-col overflow-y-auto">
      {orderBy(recordings, "date", "desc").map((r, i) => (
        <ReplayRow recording={r} key={i} />
      ))}
    </div>
  );
}

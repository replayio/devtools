import MaterialIcon from "ui/components/shared/MaterialIcon";
import { Recording } from "ui/types";

export function ReplayRows({ recordings }: { recordings: Recording[] }) {
  return (
    <>
      {recordings.map((r, i) => (
        <ReplayRow recording={r} key={i} />
      ))}
    </>
  );
}

function ReplayRow({ recording }: { recording: Recording }) {
  const { metadata, date } = recording;

  return (
    <a
      href={`/recording/${recording.id}`}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:underline"
    >
      <div className="flex flex-row items-center space-x-2">
        <ResultIcon result={metadata.test?.result} />
        <div className="flex flex-row space-x-2 text-gray-500">
          <div>{new Date(date).toDateString()}</div>
          <div className="flex flex-row space-x-1 items-center">
            <div>{metadata.source?.branch || "branch_name"}</div>
            <div>{metadata.source?.commit.id.slice(0, 7) || "commit_id"}</div>
            <div>{recording.duration * 1000}s</div>
          </div>
        </div>
      </div>
    </a>
  );
}

function ResultIcon({ result }: { result?: "passed" | "failed" | "timedOut" }) {
  if (result === "passed") {
    return <MaterialIcon className="text-green-500">check_circle</MaterialIcon>;
  } else if (result === "failed") {
    return <MaterialIcon className="text-red-500">error</MaterialIcon>;
  } else if (result === "timedOut") {
    // TODO: Add a timeout icon
    return null;
  }

  return null;
}

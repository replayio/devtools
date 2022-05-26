import MaterialIcon from "../shared/MaterialIcon";

export function TestResult({ result }: { result?: "passed" | "failed" | "timedOut" }) {
  if (result === "passed") {
    return (
      <div className="flex text-green-500">
        <MaterialIcon>check_circle</MaterialIcon>
      </div>
    );
  } else if (result === "failed") {
    return (
      <div className="flex text-red-500">
        <MaterialIcon>error</MaterialIcon>
      </div>
    );
  } else if (result === "timedOut") {
    // TODO: Add a timeout icon
    return null;
  }

  return null;
}

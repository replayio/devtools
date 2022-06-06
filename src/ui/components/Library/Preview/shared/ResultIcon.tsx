import MaterialIcon from "ui/components/shared/MaterialIcon";

export function ResultIcon({ result }: { result?: "passed" | "failed" | "timedOut" }) {
  if (result === "passed") {
    return (
      <MaterialIcon className="text-green-500" iconSize="xl">
        check_circle
      </MaterialIcon>
    );
  } else if (result === "failed") {
    return (
      <MaterialIcon className="text-red-500" iconSize="xl">
        error
      </MaterialIcon>
    );
  } else if (result === "timedOut") {
    // TODO: Add a timeout icon
    return null;
  }

  return null;
}

import MaterialIcon from "../shared/MaterialIcon";

export function TestResult({ result }: { result: "passed" | "failed" }) {
  return result === "passed" ? (
    <div className="flex text-green-500">
      <MaterialIcon>check_circle</MaterialIcon>
    </div>
  ) : (
    <div className="flex text-red-500">
      <MaterialIcon>error</MaterialIcon>
    </div>
  );
}

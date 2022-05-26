import { useContext } from "react";
import { LibraryContext } from "../useFilters";
import { TestPreview } from "./TestPreview";
import { TestRunPreview } from "./TestRunPreview";

export function Preview() {
  const { preview } = useContext(LibraryContext);
  return (
    <div
      className="flex flex-col bg-white rounded-md shadow-md text-sm p-4 space-y-2"
      style={{ width: "30rem" }}
    >
      {preview?.view === "tests" ? <TestPreview /> : <TestRunPreview />}
    </div>
  );
}

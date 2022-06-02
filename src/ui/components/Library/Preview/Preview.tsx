import { useContext } from "react";
import { LibraryContext } from "../useFilters";
import { TestPreview } from "./TestPreview";
import { TestRunPreview } from "./TestRunPreview";

export function Preview() {
  const { preview } = useContext(LibraryContext);
  return (
    <div
      className="flex flex-col bg-white rounded-md shadow-md text-sm p-4 space-y-4 overflow-auto"
      style={{ width: "50rem" }}
    >
      {preview?.view === "tests" ? <TestPreview /> : <TestRunPreview />}
    </div>
  );
}

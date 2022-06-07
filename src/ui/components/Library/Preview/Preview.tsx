import { useContext } from "react";
import { LibraryContext } from "../useFilters";
import { TestPreview } from "./TestPreview/TestPreview";
import { TestRunPreview } from "./TestRunPreview/TestRunPreview";

export function Preview() {
  const { preview } = useContext(LibraryContext);
  return (
    <div
      className="flex flex-col overflow-auto text-sm bg-white rounded-md shadow-md"
      style={{ width: "50rem" }}
    >
      {preview?.view === "tests" ? <TestPreview /> : <TestRunPreview />}
    </div>
  );
}

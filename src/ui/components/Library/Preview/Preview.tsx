import { TestRunPreview } from "./TestRunPreview/TestRunPreview";

export function Preview() {
  return (
    <div
      className="flex flex-col overflow-hidden text-sm bg-white rounded-md shadow-md"
      style={{ width: "50rem" }}
    >
      <TestRunPreview />
    </div>
  );
}

import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetTestRun } from "ui/hooks/tests";
import { LibraryContext } from "../useFilters";
import { ReplayRows } from "./ReplayRows";

export function TestRunPreview() {
  const { preview } = useContext(LibraryContext);
  const { testRun, loading } = useGetTestRun(preview!.id as string);

  if (!testRun || loading) {
    return <>Loading…</>;
  }

  return (
    <>
      <div className="flex flex-row text-xl items-center space-x-2">
        <div>{testRun.id}</div>
      </div>
      <ReplayRows recordings={testRun.recordings} />
    </>
  );
}

import { useContext } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetTest } from "ui/hooks/tests";
import { LibraryContext } from "../useFilters";
import { ReplayRows } from "./ReplayRows";

export function TestPreview() {
  const { preview } = useContext(LibraryContext);
  const { test, loading } = useGetTest(preview!.id as string[]);

  if (!test || loading) {
    return <>Loading…</>;
  }

  return (
    <>
      <div className="flex flex-row text-xl items-center space-x-2">
        <div>{test.title}</div>
      </div>
      <div
        className="overflow-hidden overflow-ellipsis whitespace-pre text-left"
        style={{ direction: "rtl" }}
      >
        {test.path.filter(Boolean).join(" > ")}
      </div>
      <ReplayRows recordings={test.recordings} />
    </>
  );
}

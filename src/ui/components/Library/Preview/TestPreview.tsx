import { useContext } from "react";
import { useGetTestForWorkspace } from "ui/hooks/tests";
import { LibraryContext } from "../useFilters";
import { ReplayRows } from "./ReplayRows";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export function TestPreview() {
  const { preview } = useContext(LibraryContext);
  const { test, loading } = useGetTestForWorkspace(preview!.id as string[]);

  if (!test || loading) {
    return <>Loading…</>;
  }

  return (
    <>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row text-xl items-center space-x-2">
          <div>{test.title}</div>
        </div>
        <div className="flex flex-row space-x-2">
          <div className="flex flex-row space-x-1 items-center">
            <MaterialIcon>web_asset</MaterialIcon>
            <div>{test.path[1]}</div>
          </div>
          <div className="flex flex-row space-x-1 items-center">
            <MaterialIcon>description</MaterialIcon>
            <div>{test.path[test.path.length - 2]}</div>
          </div>
        </div>
      </div>
      <ReplayRows recordings={test.recordings} />
    </>
  );
}

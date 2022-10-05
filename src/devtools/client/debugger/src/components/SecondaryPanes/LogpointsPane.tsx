import MaterialIcon from "ui/components/shared/MaterialIcon";

import Breakpoints from "./Breakpoints";

export default function LogpointsPane() {
  return (
    <Breakpoints
      emptyContent={
        <>
          {`Click on the `}
          <span className="inline-flex rounded-sm bg-gray-400 text-white">
            <MaterialIcon iconSize="xs">add</MaterialIcon>
          </span>
          {` in the editor to add a print statement`}
        </>
      }
      type="logpoint"
    />
  );
}

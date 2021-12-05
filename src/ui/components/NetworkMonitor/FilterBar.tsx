import React from "react";
import MaterialIcon from "../shared/MaterialIcon";
import TypesDropdown from "./TypesDropdown";
import { RequestType } from "./utils";

export default function FilterBar({
  table,
  toggleType,
  types,
}: {
  table: any;
  toggleType: (type: RequestType) => void;
  types: Set<RequestType>;
}) {
  return (
    <div className="bg-white border-1 border-b border-bottom flex items-center px-1 py-1">
      <TypesDropdown toggleType={toggleType} types={types} />

      <MaterialIcon iconSize="lg">search</MaterialIcon>

      <input
        placeholder="Filter requests"
        onChange={e => table.setGlobalFilter(e.target.value)}
        className=" px-1 bg-transparent"
      />
    </div>
  );
}

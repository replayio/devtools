import React, { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

export function FullTextFilter({ results, onKeyDown }) {
  const { status } = results;
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="p-2">
      <div className="px-2 py-1 border-0 bg-gray-100 rounded-md flex items-center space-x-2">
        <MaterialIcon>search</MaterialIcon>
        <input
          style={{ boxShadow: "unset" }}
          placeholder="Find in files…"
          className="border-0 bg-transparent p-0 flex-grow text-xs focus:outline-none"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
        {status === "LOADING" ? <Spinner className="animate-spin h-4 w-4" /> : null}
      </div>
    </div>
  );
}

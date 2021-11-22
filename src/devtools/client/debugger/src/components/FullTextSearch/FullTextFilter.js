import React, { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

export function FullTextFilter({ results, onKeyDown }) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  function inputOnKeyDown(e) {
    if (e.key === "Escape") {
      return;
    }

    e.stopPropagation();

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = (historyIndex + 1) % history.length;
      setHistoryIndex(newIndex);
      return setValue(history[newIndex]);
    }

    if (e.key === "ArrowDown" && historyIndex !== 0) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return setValue(history[newIndex]);
    }

    // Don't add the same query to the history
    const searchQuery = onKeyDown(e);
    if (searchQuery && !history.includes(searchQuery)) {
      setHistory([searchQuery, ...history]);
      setHistoryIndex(0);
    }
  }

  return (
    <div className="p-2">
      <div className="px-2 py-1 border-0 bg-gray-100 rounded-md flex items-center space-x-2">
        <MaterialIcon>search</MaterialIcon>
        <input
          style={{ boxShadow: "unset" }}
          placeholder="Find in files…"
          className="border-0 bg-transparent p-0 flex-grow text-xs focus:outline-none"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={inputOnKeyDown}
          autoFocus
        />
        {results.status === "LOADING" ? <Spinner className="animate-spin h-4 w-4" /> : null}
      </div>
    </div>
  );
}

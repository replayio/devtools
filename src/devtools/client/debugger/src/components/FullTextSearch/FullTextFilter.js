import React, { useState, useRef, useEffect } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

export function FullTextFilter({
  value,
  setValue,
  focused,
  results,
  onKeyDown,
  focusFullTextInput,
}) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const inputRef = useRef();

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => inputRef.current?.focus(), [focused]);

  function inputOnKeyDown(e) {
    if (e.key === "Escape") {
      return;
    }

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
          onFocus={() => focusFullTextInput(false)}
          ref={inputRef}
          autoFocus
        />
        {results.status === "LOADING" ? <Spinner className="animate-spin h-4 w-4" /> : null}
      </div>
    </div>
  );
}

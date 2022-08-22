import React, { useState, useRef, useEffect } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

import type { FTSState } from "./index";

interface FTFProps {
  value: string;
  setValue: (value: string) => void;
  focused: boolean;
  results: FTSState["results"];
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  focusFullTextInput: (shouldFocus: boolean) => void;
}

export function FullTextFilter({
  value,
  setValue,
  focused,
  results,
  onKeyDown,
  focusFullTextInput,
}: FTFProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), [focused]);

  return (
    <div className="p-2">
      <div className="flex items-center space-x-2 rounded-md border-0 bg-themeTextFieldBgcolor px-2 py-1">
        <MaterialIcon>search</MaterialIcon>
        <input
          style={{ boxShadow: "unset" }}
          placeholder="Find in files…"
          className="flex-grow border-0 bg-themeTextFieldBgcolor p-0 text-xs text-themeTextFieldColor focus:outline-none"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => focusFullTextInput(false)}
          ref={inputRef}
          autoFocus
        />
        {results.status === "LOADING" ? <Spinner className="h-4 w-4 animate-spin" /> : null}
      </div>
    </div>
  );
}

import React from "react";

import ManagedTree from "../shared/ManagedTree";
import { FullTextItem } from "./FullTextItem";
import { FullTextSummary } from "./FullTextSummary";
import type { FTSState } from "./index";
import { SourceMatchEntry, SourceResultEntry } from "./search";

type EitherEntry = SourceResultEntry | SourceMatchEntry;

function getFilePath(item: EitherEntry) {
  return item.type === "RESULT"
    ? `${item.sourceId}`
    : `${item.sourceId}-${item.line}-${item.column}`;
}

interface FTRProps {
  results: FTSState["results"];
  query: string;
  focusedItem: EitherEntry | null;
  onItemSelect: (item: SourceMatchEntry) => void;
  onFocus: (item: EitherEntry) => void;
}

export function FullTextResults({ results, query, onItemSelect, focusedItem, onFocus }: FTRProps) {
  const { status, matchesBySource } = results;
  if (!query) {
    return null;
  }

  if (!matchesBySource.length) {
    const msg = status === "LOADING" ? "Loading\u2026" : "No results found";
    return <div className="px-2">{msg}</div>;
  }

  return (
    <div className="flex flex-col overflow-hidden px-2">
      <FullTextSummary results={results} />
      <div className="h-full overflow-y-auto">
        <ManagedTree
          getRoots={() => matchesBySource}
          getChildren={(resultEntry: SourceResultEntry) => resultEntry.matches || []}
          itemHeight={24}
          autoExpandAll={true}
          autoExpandDepth={1}
          autoExpandNodeChildrenLimit={100}
          getParent={(item: EitherEntry) =>
            matchesBySource.find(source => source.sourceId === item.sourceId)
          }
          getPath={getFilePath}
          renderItem={(
            item: EitherEntry,
            depth: number,
            focused: boolean,
            _: any,
            expanded: boolean
          ) => (
            <FullTextItem
              item={item}
              focused={focused}
              expanded={expanded}
              onSelect={onItemSelect}
            />
          )}
          focused={focusedItem}
          onFocus={onFocus}
        />
      </div>
    </div>
  );
}

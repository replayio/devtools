import React from "react";
import ManagedTree from "../shared/ManagedTree";
import { FullTextItem } from "./FullTextItem";
import { FullTextSummary } from "./FullTextSummary";

function getFilePath(item) {
  return item.type === "RESULT"
    ? `${item.sourceId}`
    : `${item.sourceId}-${item.line}-${item.column}`;
}

export function FullTextResults({ results, onItemSelect, focusedItem, onFocus }) {
  const { status, matchesBySource } = results;
  if (!results.query) {
    return;
  }

  if (!matchesBySource.length) {
    const msg = status === "LOADING" ? "Loading\u2026" : "No results found";
    return <div className="px-2">{msg}</div>;
  }

  return (
    <div className="overflow-hidden px-2 flex flex-col">
      <FullTextSummary results={results} />
      <div className="h-full overflow-y-auto">
        <ManagedTree
          getRoots={() => matchesBySource}
          getChildren={file => file.matches || []}
          itemHeight={24}
          autoExpandAll={true}
          autoExpandDepth={1}
          autoExpandNodeChildrenLimit={100}
          getParent={item => matchesBySource.find(source => source.sourceId === item.sourceId)}
          getPath={getFilePath}
          renderItem={(item, depth, focused, _, expanded) => (
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

import { useContext, useSyncExternalStore } from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import {
  StreamingSourceSearchResults,
  searchSourcesSuspense,
} from "bvaughn-architecture-demo/src/suspense/SearchCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./InlineResultsCount.module.css";

export default function InlineResultsCount({
  includeNodeModules,
  isPending,
  limit,
  query,
}: {
  includeNodeModules: boolean;
  isPending: boolean;
  limit?: number;
  query: string;
}) {
  const client = useContext(ReplayClientContext);

  if (query.trim() === "") {
    return null;
  }

  const streamingResults = searchSourcesSuspense(client, query, includeNodeModules, limit);

  return <StreamingInlineResultsCount isPending={isPending} streamingResults={streamingResults} />;
}

function StreamingInlineResultsCount({
  isPending,
  streamingResults,
}: {
  isPending: boolean;
  streamingResults: StreamingSourceSearchResults;
}) {
  const isComplete = useSyncExternalStore(
    streamingResults.subscribe,
    () => streamingResults.complete,
    () => streamingResults.complete
  );

  const fetchedCount = useSyncExternalStore(
    streamingResults.subscribe,
    () => streamingResults.fetchedCount,
    () => streamingResults.fetchedCount
  );

  const totalCount = useSyncExternalStore(
    streamingResults.subscribe,
    () => streamingResults.totalCount,
    () => streamingResults.totalCount
  );

  if (!isComplete) {
    return <Icon className={styles.SpinnerIcon} type="spinner" />;
  }

  let label = "";
  switch (totalCount) {
    case 0:
      label = "No matches";
      break;
    case 1:
      label = "1 result";
      break;
    default:
      if (fetchedCount !== totalCount) {
        label = `first ${fetchedCount} results`;
      } else {
        label = `${totalCount} results`;
      }
      break;
  }

  return (
    <div
      className={isPending ? styles.ResultsCountPending : styles.ResultsCount}
      data-test-id="SearchFiles-SummaryLabel"
      data-test-state={isPending ? "pending" : "complete"}
    >
      {label}
    </div>
  );
}

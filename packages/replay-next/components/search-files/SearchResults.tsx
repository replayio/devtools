import { ReactNode, useMemo } from "react";
import { STATUS_PENDING, STATUS_REJECTED, useStreamingValue } from "suspense";

import Icon from "replay-next/components/Icon";
import { SourceSearchResult, StreamingSearchValue } from "replay-next/src/suspense/SearchCache";

import styles from "./SearchResults.module.css";

const EMPTY_ARRAY = [] as SourceSearchResult[];

export default function SearchResults({
  query,
  streaming,
}: {
  query: string;
  streaming: StreamingSearchValue;
}) {
  const { data, error, status, value = EMPTY_ARRAY } = useStreamingValue(streaming);

  const fileCount = useMemo(() => {
    const sourceIdSet = new Set<string>();
    value.forEach(result => {
      switch (result.type) {
        case "location": {
          sourceIdSet.add(result.location.sourceId);
          break;
        }
      }
    });
    return sourceIdSet.size;
  }, [value]);

  const didOverflow = data?.didOverflow ?? false;
  const fetchedCount = data?.fetchedCount ?? 0;

  let rendered: ReactNode = null;
  switch (status) {
    case STATUS_PENDING: {
      rendered = <Icon className={styles.SpinnerIcon} type="spinner" />;
      break;
    }
    case STATUS_REJECTED: {
      const errorMessage = (typeof error === "string" ? error : error?.message) ?? "Unknown error";

      rendered = (
        <div title={errorMessage}>
          <Icon className={styles.ErrorIcon} type="error" />
        </div>
      );
      break;
    }
    default: {
      switch (fetchedCount) {
        case 0:
          if (query) {
            rendered = "No results found. Review your settings for configured exclusions.";
          }
          break;
        case 1:
          rendered = "1 result.";
          break;
        default:
          if (didOverflow) {
            rendered = `First ${fetchedCount} results.`;
          } else {
            rendered = `${fetchedCount} results in ${fileCount} files.`;
          }
          break;
      }
    }
  }

  const isPending = status === STATUS_PENDING;

  return (
    <div
      className={isPending ? styles.ResultsCountPending : styles.ResultsCount}
      data-test-id="SearchFiles-SummaryLabel"
      data-test-state={isPending ? "pending" : "complete"}
    >
      {rendered}
    </div>
  );
}

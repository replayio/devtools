import { ReactNode } from "react";
import { STATUS_PENDING, STATUS_REJECTED, useStreamingValue } from "suspense";

import Icon from "replay-next/components/Icon";
import { StreamingSearchValue } from "replay-next/src/suspense/SearchCache";

import styles from "./InlineResultsCount.module.css";

export default function InlineResultsCount({ streaming }: { streaming: StreamingSearchValue }) {
  const { data, error, status } = useStreamingValue(streaming);

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
          rendered = "No matches";
          break;
        case 1:
          rendered = "1 result";
          break;
        default:
          if (didOverflow) {
            rendered = `first ${fetchedCount} results`;
          } else {
            rendered = `${fetchedCount} results`;
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

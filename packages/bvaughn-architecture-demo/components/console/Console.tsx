import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Loader from "@bvaughn/components/Loader";
import { LogPointsContextRoot } from "@bvaughn/src/contexts/LogPointsContext";
import { Suspense } from "react";

import styles from "./ConsoleRoot.module.css";
import Filters from "./Filters";
import Input from "./Input";
import MessagesList from "./MessagesList";
import Search from "./Search";
import SearchRoot from "./SearchRoot";

export default function ConsoleRoot() {
  return (
    <ConsoleFiltersContextRoot>
      <LogPointsContextRoot>
        <SearchRoot>
          <div className={styles.ConsoleRoot} data-test-id="ConsoleRoot">
            <div className={styles.Row}>
              <Filters />
            </div>
            <div className={styles.ContentArea}>
              <ErrorBoundary>
                <Suspense fallback={<Loader />}>
                  <MessagesList />
                </Suspense>
              </ErrorBoundary>
            </div>
            <Search className={styles.Row} hideOnEscape={false} />
            <Input className={styles.Row} />
          </div>
        </SearchRoot>
      </LogPointsContextRoot>
    </ConsoleFiltersContextRoot>
  );
}

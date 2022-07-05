import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Loader from "@bvaughn/components/Loader";
import { LogPointsContextRoot } from "@bvaughn/src/contexts/LogPointsContext";
import { Suspense } from "react";

import styles from "./ConsoleRoot.module.css";
import FilterToggles from "./FilterToggles";
import FilterText from "./FilterText";
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
            <div className={styles.FilterColumn}>
              <FilterToggles />
            </div>
            <div className={styles.MessageColumn}>
              <FilterText />
              <ErrorBoundary>
                <Suspense fallback={<Loader />}>
                  <MessagesList />
                </Suspense>
              </ErrorBoundary>
              <Search className={styles.Row} hideOnEscape={false} />
              <Input className={styles.Row} />
            </div>
          </div>
        </SearchRoot>
      </LogPointsContextRoot>
    </ConsoleFiltersContextRoot>
  );
}

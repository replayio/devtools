import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Loader from "@bvaughn/components/Loader";
import { LogPointsContextRoot } from "@bvaughn/src/contexts/LogPointsContext";
import { Suspense, useRef } from "react";

import styles from "./ConsoleRoot.module.css";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import Input from "./Input";
import MessagesList from "./MessagesList";
import Search from "./Search";
import SearchRoot from "./SearchRoot";

export default function ConsoleRoot() {
  const messageListRef = useRef<HTMLElement>(null);

  return (
    <ConsoleFiltersContextRoot>
      <LogPointsContextRoot>
        <SearchRoot messageListRef={messageListRef}>
          <div className={styles.ConsoleRoot} data-test-id="ConsoleRoot">
            <div className={styles.FilterColumn}>
              <FilterToggles />
            </div>
            <div className={styles.MessageColumn}>
              <FilterText />
              <ErrorBoundary>
                <Suspense fallback={<Loader />}>
                  <MessagesList ref={messageListRef} />
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

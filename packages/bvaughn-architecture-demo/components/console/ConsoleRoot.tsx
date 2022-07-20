import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Icon from "@bvaughn/components/Icon";
import Loader from "@bvaughn/components/Loader";
import { ReactNode, Suspense, unstable_Offscreen as Offscreen, useRef, useState } from "react";

import styles from "./ConsoleRoot.module.css";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import Input from "./Input";
import MessagesList from "./MessagesList";
import Search from "./Search";
import { SearchContextRoot } from "./SearchContext";
import { LoggablesContextRoot } from "./LoggablesContext";

export default function ConsoleRoot({
  showSearchInputByDefault = true,
  terminalInput = null,
}: {
  showSearchInputByDefault?: boolean;
  terminalInput?: ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const messageListRef = useRef<HTMLElement>(null);

  return (
    <ConsoleFiltersContextRoot>
      <LoggablesContextRoot messageListRef={messageListRef}>
        <SearchContextRoot
          messageListRef={messageListRef}
          showSearchInputByDefault={showSearchInputByDefault}
        >
          <div className={styles.ConsoleRoot} data-test-id="ConsoleRoot">
            <div className={styles.TopRow}>
              <button
                className={styles.MenuToggleButton}
                date-test-id="ConsoleMenuToggleButton"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title={isMenuOpen ? "Close filter menu" : "Open filter menu"}
              >
                <Icon
                  className={styles.MenuToggleButtonIcon}
                  type={isMenuOpen ? "menu-open" : "menu-closed"}
                />
              </button>
              <FilterText />
            </div>
            <div className={styles.BottomRow}>
              <Offscreen mode={isMenuOpen ? "visible" : "hidden"}>
                <div className={styles.FilterColumn}>
                  <FilterToggles />
                </div>
              </Offscreen>
              <div className={styles.MessageColumn}>
                <ErrorBoundary>
                  <Suspense fallback={<Loader />}>
                    <MessagesList ref={messageListRef} />
                  </Suspense>
                </ErrorBoundary>

                {terminalInput}

                <Search className={styles.Row} hideOnEscape={terminalInput !== null} />
              </div>
            </div>
          </div>
        </SearchContextRoot>
      </LoggablesContextRoot>
    </ConsoleFiltersContextRoot>
  );
}

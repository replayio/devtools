import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Icon from "@bvaughn/components/Icon";
import Loader from "@bvaughn/components/Loader";
import { Suspense, unstable_Offscreen as Offscreen, useRef, useState } from "react";

import styles from "./ConsoleRoot.module.css";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import Input from "./Input";
import MessagesList from "./MessagesList";
import Search from "./Search";
import SearchRoot from "./SearchRoot";

export default function ConsoleRoot() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const messageListRef = useRef<HTMLElement>(null);

  return (
    <ConsoleFiltersContextRoot>
      <SearchRoot messageListRef={messageListRef}>
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
              <Search className={styles.Row} hideOnEscape={false} />
              <Input className={styles.Row} />
            </div>
          </div>
        </div>
      </SearchRoot>
    </ConsoleFiltersContextRoot>
  );
}

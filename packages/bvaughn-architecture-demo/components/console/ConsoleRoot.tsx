import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Icon from "@bvaughn/components/Icon";
import Loader from "@bvaughn/components/Loader";
import {
  ReactNode,
  Suspense,
  unstable_Offscreen as Offscreen,
  useContext,
  useRef,
  useState,
} from "react";
import { TerminalContext } from "@bvaughn/src/contexts/TerminalContext";

import { ConsoleContextMenuContextRoot } from "./ConsoleContextMenuContext";
import styles from "./ConsoleRoot.module.css";
import ContextMenu from "./ContextMenu";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import { LoggablesContextRoot } from "./LoggablesContext";
import MessagesList from "./MessagesList";
import Search from "./Search";
import { SearchContextRoot } from "./SearchContext";

export default function ConsoleRoot({
  showSearchInputByDefault = true,
  terminalInput = null,
}: {
  showSearchInputByDefault?: boolean;
  terminalInput?: ReactNode;
}) {
  const { clearMessages: clearConsoleEvaluations, messages: consoleEvaluations } =
    useContext(TerminalContext);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const messageListRef = useRef<HTMLElement>(null);

  return (
    <ConsoleContextMenuContextRoot>
      <ConsoleFiltersContextRoot>
        <LoggablesContextRoot messageListRef={messageListRef}>
          <SearchContextRoot
            messageListRef={messageListRef}
            showSearchInputByDefault={showSearchInputByDefault}
          >
            <div
              className={styles.ConsoleRoot}
              data-filter-open={isMenuOpen}
              data-test-id="ConsoleRoot"
            >
              <div className={styles.ConsoleActions}>
                <button
                  className={styles.MenuToggleButton}
                  data-test-id="ConsoleMenuToggleButton"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  title={isMenuOpen ? "Close filter menu" : "Open filter menu"}
                >
                  <Icon
                    className={styles.MenuToggleButtonIcon}
                    type={isMenuOpen ? "menu-open" : "menu-closed"}
                  />
                </button>

                {consoleEvaluations.length > 0 && (
                  <button
                    className={styles.DeleteTerminalExpressionButton}
                    data-test-id="ClearConsoleEvaluationsButton"
                    onClick={clearConsoleEvaluations}
                    title="Clear console evaluations"
                  >
                    <Icon className={styles.DeleteTerminalExpressionIcon} type="delete" />
                  </button>
                )}
              </div>

              <FilterText />

              <div className={styles.Divider} />

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

              <ContextMenu />
            </div>
          </SearchContextRoot>
        </LoggablesContextRoot>
      </ConsoleFiltersContextRoot>
    </ConsoleContextMenuContextRoot>
  );
}

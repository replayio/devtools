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
  useLayoutEffect,
  useState,
} from "react";
import { TerminalContext } from "@bvaughn/src/contexts/TerminalContext";
import useLocalStorage from "@bvaughn/src/hooks/useLocalStorage";
import classNames from "classnames";

import { ConsoleContextMenuContextRoot } from "./ConsoleContextMenuContext";
import styles from "./ConsoleRoot.module.css";
import ContextMenu from "./ContextMenu";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import { LoggablesContextRoot } from "./LoggablesContext";
import MessagesList from "./MessagesList";
import Search from "./Search";
import { SearchContextRoot } from "./SearchContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";

export default function ConsoleRoot({
  nagHeader = null,
  showSearchInputByDefault = true,
  terminalInput = null,
}: {
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  showSearchInputByDefault?: boolean;
  terminalInput?: ReactNode;
}) {
  const { clearMessages: clearConsoleEvaluations, messages: consoleEvaluations } =
    useContext(TerminalContext);

  const { recordingId } = useContext(SessionContext);
  const [isMenuOpen, setIsMenuOpen] = useLocalStorage<boolean>(
    `Replay:Console:MenuOpen:${recordingId}`,
    false
  );
  const [menuValueHasBeenToggled, setMenuValueHasBeenToggled] = useState(false);

  const messageListRef = useRef<HTMLElement>(null);

  // We default to having the console filters panel turned off, to minimize UI "busyness".
  // _If_ it's off initially, we want to completely skip rendering it, which
  // avoids making the "fetch events" calls during app startup to speed up loading.
  // But, if it's ever been shown and toggled off, continue rendering it
  // inside the `<Offscreen>` to preserve state.
  const renderFilters = isMenuOpen || menuValueHasBeenToggled;

  return (
    <ConsoleContextMenuContextRoot>
      <ConsoleFiltersContextRoot>
        <div
          className={classNames(styles.ConsoleRoot, isMenuOpen && styles.ConsoleRootOpen)}
          data-test-id="ConsoleRoot"
        >
          <div className={styles.ConsoleActions}>
            <button
              className={styles.MenuToggleButton}
              data-test-id="ConsoleMenuToggleButton"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setMenuValueHasBeenToggled(true);
              }}
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

          <Offscreen mode={isMenuOpen ? "visible" : "hidden"}>
            <div className={styles.FilterColumn}>
              <Suspense fallback={<Loader />}>{renderFilters && <FilterToggles />}</Suspense>
            </div>
          </Offscreen>

          <Suspense
            fallback={
              <div className={styles.Loader}>
                <Loader />
              </div>
            }
          >
            <ErrorBoundary fallbackClassName={styles.ErrorBoundaryFallback}>
              <LoggablesContextRoot messageListRef={messageListRef}>
                <SearchContextRoot
                  messageListRef={messageListRef}
                  showSearchInputByDefault={showSearchInputByDefault}
                >
                  <div className={styles.MessageColumn}>
                    {nagHeader}

                    <MessagesList ref={messageListRef} />

                    {terminalInput}

                    <Search className={styles.Row} hideOnEscape={terminalInput !== null} />
                  </div>
                </SearchContextRoot>
              </LoggablesContextRoot>
            </ErrorBoundary>
          </Suspense>

          <ContextMenu />
        </div>
      </ConsoleFiltersContextRoot>
    </ConsoleContextMenuContextRoot>
  );
}

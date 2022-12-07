import classNames from "classnames";
import {
  KeyboardEvent,
  unstable_Offscreen as Offscreen,
  ReactNode,
  RefObject,
  Suspense,
  useContext,
  useRef,
  useState,
} from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Icon from "bvaughn-architecture-demo/components/Icon";
import IndeterminateLoader from "bvaughn-architecture-demo/components/IndeterminateLoader";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { ConsoleFiltersContextRoot } from "bvaughn-architecture-demo/src/contexts/ConsoleFiltersContext";
import { TerminalContext } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import useLocalStorage from "bvaughn-architecture-demo/src/hooks/useLocalStorage";

import ConsoleInput from "./ConsoleInput";
import ConsoleSearch from "./ConsoleSearch";
import { ConsoleSearchContext, ConsoleSearchContextRoot } from "./ConsoleSearchContext";
import FilterText from "./filters/FilterText";
import FilterToggles from "./filters/FilterToggles";
import { LoggablesContextRoot } from "./LoggablesContext";
import MessagesList from "./MessagesList";
import styles from "./ConsoleRoot.module.css";

export default function ConsoleRoot({
  nagHeader = null,
  showFiltersByDefault = true,
  showSearchInputByDefault = true,
}: {
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  showFiltersByDefault?: boolean;
  showSearchInputByDefault?: boolean;
}) {
  const messageListRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <ErrorBoundary>
      <Suspense fallback={<IndeterminateLoader />}>
        <ConsoleFiltersContextRoot>
          <LoggablesContextRoot messageListRef={messageListRef}>
            <ConsoleSearchContextRoot
              messageListRef={messageListRef}
              searchInputRef={searchInputRef}
              showSearchInputByDefault={showSearchInputByDefault}
            >
              <Console
                messageListRef={messageListRef}
                nagHeader={nagHeader}
                searchInputRef={searchInputRef}
                showFiltersByDefault={showFiltersByDefault}
              />
            </ConsoleSearchContextRoot>
          </LoggablesContextRoot>
        </ConsoleFiltersContextRoot>
      </Suspense>
    </ErrorBoundary>
  );
}

function Console({
  messageListRef,
  nagHeader = null,
  searchInputRef,
  showFiltersByDefault = true,
}: {
  messageListRef: RefObject<HTMLElement>;
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  searchInputRef: RefObject<HTMLInputElement>;
  showFiltersByDefault?: boolean;
}) {
  const [_, searchActions] = useContext(ConsoleSearchContext);
  const { clearMessages: clearConsoleEvaluations, messages: consoleEvaluations } =
    useContext(TerminalContext);

  const [isMenuOpen, setIsMenuOpen] = useLocalStorage<boolean>(
    `Replay:Console:MenuOpen`,
    showFiltersByDefault
  );
  const [menuValueHasBeenToggled, setMenuValueHasBeenToggled] = useState(false);

  // We default to having the console filters panel turned off, to minimize UI "busyness".
  // _If_ it's off initially, we want to completely skip rendering it, which
  // avoids making the "fetch events" calls during app startup to speed up loading.
  // But, if it's ever been shown and toggled off, continue rendering it
  // inside the `<Offscreen>` to preserve state.
  const renderFilters = isMenuOpen || menuValueHasBeenToggled;

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      case "f": {
        if (event.shiftKey) {
          // Cmd+Shift+F is reserved global search.
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          searchActions.show();

          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
      case "g": {
        if (event.ctrlKey || event.metaKey) {
          // Unlike Enter / Shift+Enter, this event handler is external to the Search input
          // so that we can mirror UIs like Chrome and Code and re-open the search UI if it's been closed
          searchActions.show();
          if (event.shiftKey) {
            searchActions.goToPrevious();
          } else {
            searchActions.goToNext();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    }
  };

  return (
    <div
      className={classNames(styles.ConsoleRoot, isMenuOpen && styles.ConsoleRootOpen)}
      data-test-id="ConsoleRoot"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className={styles.ConsoleActions}>
        <button
          className={styles.MenuToggleButton}
          data-test-id="ConsoleMenuToggleButton"
          data-test-state={isMenuOpen ? "open" : "closed"}
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
          <div className={styles.MessageColumn}>
            {nagHeader}

            <MessagesList ref={messageListRef} />

            <ConsoleInput />

            <ConsoleSearch className={styles.Row} searchInputRef={searchInputRef} />
          </div>
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

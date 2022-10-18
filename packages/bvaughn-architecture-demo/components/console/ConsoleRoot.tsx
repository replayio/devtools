import { ConsoleFiltersContextRoot } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Icon from "@bvaughn/components/Icon";
import Loader from "@bvaughn/components/Loader";
import {
  KeyboardEvent,
  ReactNode,
  RefObject,
  Suspense,
  unstable_Offscreen as Offscreen,
  useContext,
  useRef,
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
import ConsoleSearch from "./ConsoleSearch";
import { ConsoleSearchContext, ConsoleSearchContextRoot } from "./ConsoleSearchContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";

export default function ConsoleRoot({
  nagHeader = null,
  showFiltersByDefault = true,
  showSearchInputByDefault = true,
  terminalInput = null,
}: {
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  showFiltersByDefault?: boolean;
  showSearchInputByDefault?: boolean;
  terminalInput?: ReactNode;
}) {
  const messageListRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <ConsoleContextMenuContextRoot>
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
              terminalInput={terminalInput}
            />
          </ConsoleSearchContextRoot>
        </LoggablesContextRoot>
      </ConsoleFiltersContextRoot>
    </ConsoleContextMenuContextRoot>
  );
}

function Console({
  messageListRef,
  nagHeader = null,
  searchInputRef,
  showFiltersByDefault = true,
  terminalInput = null,
}: {
  messageListRef: RefObject<HTMLElement>;
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  searchInputRef: RefObject<HTMLInputElement>;
  showFiltersByDefault?: boolean;
  terminalInput?: ReactNode;
}) {
  const [_, searchActions] = useContext(ConsoleSearchContext);
  const { clearMessages: clearConsoleEvaluations, messages: consoleEvaluations } =
    useContext(TerminalContext);

  const { recordingId } = useContext(SessionContext);
  const [isMenuOpen, setIsMenuOpen] = useLocalStorage<boolean>(
    `Replay:Console:MenuOpen:${recordingId}`,
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
    switch (event.key) {
      case "f":
      case "F":
        if (event.ctrlKey || event.metaKey) {
          searchActions.show();

          event.preventDefault();
          event.stopPropagation();
        }
        break;
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

            {terminalInput}

            <ConsoleSearch
              className={styles.Row}
              hideOnEscape={terminalInput !== null}
              searchInputRef={searchInputRef}
            />
          </div>
        </ErrorBoundary>
      </Suspense>

      <ContextMenu />
    </div>
  );
}

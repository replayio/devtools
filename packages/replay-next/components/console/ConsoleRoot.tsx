import classNames from "classnames";
import {
  KeyboardEvent,
  MouseEvent,
  unstable_Offscreen as Offscreen,
  ReactNode,
  RefObject,
  Suspense,
  useContext,
  useRef,
  useState,
} from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { InlineErrorFallback } from "replay-next/components/errors/InlineErrorFallback";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { ImperativeHandle } from "replay-next/components/lexical/CodeEditor";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContextRoot } from "replay-next/src/contexts/ConsoleFiltersContext";
import { TerminalContext } from "replay-next/src/contexts/TerminalContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

import ConsoleActionsRow from "./ConsoleActionsRow";
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
  showFiltersByDefault,
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
    <InlineErrorBoundary name="ConsoleRoot">
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
    </InlineErrorBoundary>
  );
}

function Console({
  messageListRef,
  nagHeader = null,
  searchInputRef,
  showFiltersByDefault,
}: {
  messageListRef: RefObject<HTMLElement>;
  filterDrawerOpenDefault?: boolean;
  nagHeader?: ReactNode;
  searchInputRef: RefObject<HTMLInputElement>;
  showFiltersByDefault?: boolean;
}) {
  const inputRef = useRef<ImperativeHandle>(null);

  const [_, searchActions] = useContext(ConsoleSearchContext);
  const { clearMessages: clearConsoleEvaluations, messages: consoleEvaluations } =
    useContext(TerminalContext);

  const [isMenuOpen, setIsMenuOpen] = useGraphQLUserData("console_showFiltersByDefault");
  const [menuValueHasBeenToggled, setMenuValueHasBeenToggled] = useState(false);

  // We default to having the console filters panel turned off, to minimize UI "business".
  // _If_ it's off initially, we want to completely skip rendering it, which
  // avoids making the "fetch events" calls during app startup to speed up loading.
  // But, if it's ever been shown and toggled off, continue rendering it
  // inside the `<Offscreen>` to preserve state.
  const renderFilters = isMenuOpen || showFiltersByDefault || menuValueHasBeenToggled;

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

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const testName = target.getAttribute("data-test-name");
    if (testName === "Messages") {
      const input = inputRef.current;
      if (input) {
        input.focus();
      }
    }
  };

  const onSearchInputHide = () => {
    const input = inputRef.current;
    if (input) {
      input.focus();
    }
  };

  return (
    <div
      className={classNames(styles.ConsoleRoot, isMenuOpen && styles.ConsoleRootOpen)}
      data-test-id="ConsoleRoot"
      onKeyDown={onKeyDown}
    >
      <PanelGroup autoSaveId="ConsoleRoot" direction="horizontal">
        <Offscreen mode={isMenuOpen ? "visible" : "hidden"}>
          <>
            <Panel
              className={styles.LeftPanel}
              defaultSize={25}
              id="filters"
              minSize={20}
              order={1}
              style={{ overflowY: "auto" }}
            >
              {
                /* Avoid rendering two of these (even display:none) because it confuses Playwright */
                isMenuOpen && (
                  <ConsoleActionsRow
                    clearConsoleEvaluations={clearConsoleEvaluations}
                    consoleEvaluationsCount={consoleEvaluations.length}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    setMenuValueHasBeenToggled={setMenuValueHasBeenToggled}
                  />
                )
              }

              <div className={styles.FilterPanel}>
                <div className={styles.FilterColumn}>
                  <Suspense fallback={<Loader />}>{renderFilters && <FilterToggles />}</Suspense>
                </div>
              </div>
            </Panel>
            <div className={styles.PanelResizeHandleContainer}>
              <PanelResizeHandle className={styles.PanelResizeHandle} />
            </div>
          </>
        </Offscreen>

        <Panel className={styles.RightPanel} defaultSize={75} id="console" minSize={50} order={2}>
          <div className={styles.RightColumnActionsRow}>
            {!isMenuOpen && (
              <ConsoleActionsRow
                clearConsoleEvaluations={clearConsoleEvaluations}
                consoleEvaluationsCount={consoleEvaluations.length}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                setMenuValueHasBeenToggled={setMenuValueHasBeenToggled}
              />
            )}
            <FilterText />
          </div>

          <Suspense
            fallback={
              <div className={styles.Loader}>
                <Loader />
              </div>
            }
          >
            <InlineErrorBoundary
              name="ConsoleRoot"
              fallback={<InlineErrorFallback className={styles.ErrorBoundaryFallback} />}
            >
              <div className={styles.MessageColumn} onClick={onClick}>
                {nagHeader}

                <MessagesList ref={messageListRef} />

                <ConsoleInput inputRef={inputRef} />

                <ConsoleSearch
                  className={styles.ConsoleSearchRow}
                  onHide={onSearchInputHide}
                  searchInputRef={searchInputRef}
                />
              </div>
            </InlineErrorBoundary>
          </Suspense>
        </Panel>
      </PanelGroup>
    </div>
  );
}

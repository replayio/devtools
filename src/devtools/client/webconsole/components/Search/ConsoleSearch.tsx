import React, { ChangeEvent, KeyboardEvent, useContext } from "react";
import SearchInput from "devtools/client/debugger/src/components/shared/SearchInput";
import styles from "./ConsoleSearch.module.css";
import { ActionsContext, StateContext } from "./ConsoleSearchContext";

/******************************************************************
  Search feature

  Phase 1:
    * Search logic should be re-run when any of the following change:
      * Search state changes from inactive to active (and !!query)
      * Query text changes (and state == active)
      * Console log text changes (and state == active)
        * Future optimization: If possible, only evaluate new entries if change is additive?
    * Search results should be higher in the tree so that...
      * Search state is shared between console and search input
      * Search state is persisted if input is closed and reopened
    * Jumping to next/previous search should auto scroll MessageContainer into view

  Phase 2:
    * Searching (heavy lifting) should be done in a worker
      * Could we use a module-level Suspense cache for this?
        This cache could be cleared when the Console data changed?
******************************************************************/

type Props = {};

export default function ConsoleSearch({}: Props) {
  const actions = useContext(ActionsContext);
  const { index, query, results, visible } = useContext(StateContext);

  if (!visible) {
    return null;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        actions.goToPrevious();
      } else {
        actions.goToNext();
      }
    }
  };

  const onChange = (event: ChangeEvent) => {
    const newQuery = (event.target as HTMLInputElement).value;
    actions.search(newQuery);
  };

  let summaryMsg = null;
  if (query) {
    if (results.length > 0) {
      if (results.length === 1) {
        summaryMsg = "1 result";
      } else {
        summaryMsg = `${index + 1} of ${results.length} results`;
      }
    } else {
      summaryMsg = "No results found";
    }
  }

  return (
    <div className={styles.SearchBar}>
      <SearchInput
        className={styles.SearchInput}
        count={results.length}
        handleClose={actions.hide}
        handleNext={actions.goToNext}
        handlePrev={actions.goToPrevious}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Find string in logs"
        query={query}
        summaryMsg={summaryMsg}
      />
    </div>
  );
}

import FilterBar from "devtools/client/webconsole/components/FilterBar/FilterBar";
import ConsoleOutput from "devtools/client/webconsole/components/Output/ConsoleOutput";
import React, { KeyboardEvent } from "react";

// We directly require Components that we know are going to be used right away
import { MouseEventHandler } from "react";
import { useSelector } from "react-redux";
import { ConsoleNag } from "ui/components/shared/Nags/Nags";
import Warning from "ui/components/shared/Warning";

import { FilterDrawer } from "./FilterDrawer";
import JSTerm from "./Input/JSTerm";
import { ConsoleSearch, ActionsContext, StateContext, useConsoleSearch } from "./Search/";

/**
 * Console root Application component.
 */
const App = (): JSX.Element => {
  const [state, actions] = useConsoleSearch();

  // @ts-ignore
  const consoleOverflow = useSelector(state => state.messages.overflow);
  // @ts-ignore
  const filterBarDisplayMode = useSelector(state => state.consoleUI.filterBarDisplayMode);

  const onClick: MouseEventHandler<HTMLDivElement> = event => {
    // @ts-ignore
    const target = event.originalTarget || event.target;
    // Do not focus on middle/right-click or 2+ clicks.
    if (event.detail !== 1 || event.button !== 0) {
      return;
    }
    // Do not focus if a link was clicked
    if (target.closest("a")) {
      return;
    }
    // Do not focus if an input field was clicked
    if (target.closest("input")) {
      return;
    }
    // Do not focus if something other than the output region was clicked
    // (including e.g. the clear messages button in toolbar)
    if (!target.closest(".webconsole-app")) {
      return;
    }
    // Do not focus if something is selected
    const selection = document.defaultView?.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }
    window.jsterm?.editor.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        actions.hide();

        event.preventDefault();
        event.stopPropagation();
        break;
      case "f":
      case "F":
        if (event.metaKey) {
          actions.show();

          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  };

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>
        <div className="flex w-full flex-col" onKeyDown={onKeyDown}>
          <FilterBar key="filterbar" />
          <div className="flex flex-grow overflow-hidden">
            <FilterDrawer />
            <div className="webconsole-app" onClick={onClick}>
              <ConsoleNag />
              {consoleOverflow ? (
                <Warning link="https://www.notion.so/replayio/Debugger-Limitations-5b33bb0e5bd1459cbd7daf3234219c27#8d72d62414a7490586ee5ac3adef09fb">
                  There are too many console messages so not all are being displayed
                </Warning>
              ) : null}
              <div className="flexible-output-input" key="in-out-container">
                <ConsoleOutput key="console-output" />
                <JSTerm />
                <ConsoleSearch />
              </div>
            </div>
          </div>
        </div>
      </StateContext.Provider>
    </ActionsContext.Provider>
  );
};

export default App;

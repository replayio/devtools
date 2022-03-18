import clamp from "lodash/clamp";
import React, { ChangeEvent, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { ExperimentalUserSettings } from "ui/types";
import CommandButton from "./CommandButton";
import SearchInput from "./SearchInput";
import { filter } from "fuzzaldrin-plus";
import styles from "./CommandPalette.module.css";

export type Command = {
  key: CommandKey;
  label: string;
  shortcut?: string;
  settingKey?: keyof ExperimentalUserSettings;
};
export type CommandKey =
  | "open_console"
  | "open_devtools"
  | "open_elements"
  | "open_network_monitor"
  | "open_viewer"
  | "open_file_search"
  | "open_function_search"
  | "open_full_text_search"
  | "open_outline"
  | "open_print_statements"
  | "open_react_devtools"
  | "open_sources"
  | "pin_to_bottom"
  | "pin_to_left"
  | "pin_to_bottom_right"
  | "show_comments"
  | "show_console_filters"
  | "show_events"
  | "show_privacy"
  | "show_replay_info"
  | "show_sharing"
  | "toggle_dark_mode"
  | "toggle_edit_focus"
  | "toggle_video";

const COMMANDS: readonly Command[] = [
  { key: "open_console", label: "Open Console" },
  { key: "open_devtools", label: "Open DevTools" },
  { key: "open_elements", label: "Open Elements" },
  {
    key: "open_network_monitor",
    label: "Open Network Monitor",
  },
  { key: "open_viewer", label: "Open Viewer" },
  { key: "open_file_search", label: "Search for file", shortcut: "CmdOrCtrl+P" },
  { key: "open_full_text_search", label: "Search full text", shortcut: "CmdOrCtrl+Shift+F" },
  { key: "open_function_search", label: "Search for a function", shortcut: "CmdOrCtrl+Shift+O" },
  { key: "open_outline", label: "Open Outline" },
  { key: "open_print_statements", label: "Open Print Statements" },
  { key: "open_react_devtools", label: "Open React DevTools", settingKey: "showReact" },
  { key: "open_sources", label: "Open Sources" },
  { key: "show_comments", label: "Show Comments" },
  { key: "show_console_filters", label: "Show Console Filters" },
  { key: "show_events", label: "Show Events" },
  { key: "show_privacy", label: "Show Privacy" },
  { key: "show_replay_info", label: "Show Replay Info" },
  { key: "show_sharing", label: "Show Sharing Options" },
  { key: "toggle_dark_mode", label: "Toggle Dark Mode" },
  { key: "toggle_edit_focus", label: "Toggle Edit Focus Mode" },
  { key: "toggle_video", label: "Toggle Video" },
  { key: "pin_to_bottom", label: "Pin Toolbox To Bottom" },
  { key: "pin_to_left", label: "Pin Toolbox To Left" },
  { key: "pin_to_bottom_right", label: "Pin Toolbox To Bottom Right" },
] as const;

const DEFAULT_COMMANDS: readonly CommandKey[] = [
  "open_file_search",
  "open_function_search",
  "open_full_text_search",
  "open_sources",
] as const;

const COMMAND_HEIGHT = 36;
const ITEMS_TO_SHOW = 4;

function getShownCommands(searchString: string, hasReactComponents: boolean) {
  const { userSettings } = hooks.useGetUserSettings();

  const commands: readonly Command[] = searchString
    ? filter(COMMANDS as Command[], searchString, { key: "label" })
    : COMMANDS;

  const enabledCommands = commands.filter(command => {
    if (command.settingKey) {
      const isEnabled = userSettings[command.settingKey];

      if (command.key === "open_react_devtools") {
        return isEnabled && hasReactComponents;
      }

      return isEnabled;
    }

    return true;
  });

  // This puts the default commands at the top of the list.
  const sortedCommands = [...enabledCommands].sort(
    (a, b) => DEFAULT_COMMANDS.indexOf(b.key) - DEFAULT_COMMANDS.indexOf(a.key)
  );

  return sortedCommands;
}

function PaletteShortcut() {
  return (
    <div className="absolute right-4 flex select-none text-primaryAccent">
      <div className="img cmd-icon" style={{ background: "var(--primary-accent)" }} />
      <div className="img k-icon" style={{ background: "var(--primary-accent)" }} />
    </div>
  );
}

function CommandPalette({
  autoFocus = false,
  hideCommandPalette,
  executeCommand,
  hasReactComponents,
}: { autoFocus?: boolean } & PropsFromRedux) {
  const [searchString, setSearchString] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const shownCommands = getShownCommands(searchString, hasReactComponents);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      hideCommandPalette();
    } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const direction = e.key === "ArrowUp" ? -1 : 1;
      const index = activeIndex + direction;
      const resultCount = shownCommands.length;
      const nextIndex = clamp(index, 0, resultCount - 1);
      setActiveIndex(nextIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setSearchString("");
      const command = shownCommands[activeIndex];
      if (command) {
        executeCommand(command.key);
      }
    }
  };

  return (
    <div
      className={`${styles.commandPalleteWrapper} flex w-full flex-col overflow-hidden rounded-md bg-themeTabBgcolor shadow-xl`}
    >
      <div className={`${styles.commandPallete} p-3`}>
        <div className="relative flex items-center text-primaryAccent">
          <SearchInput
            value={searchString}
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
          />
          <PaletteShortcut />
        </div>
      </div>
      <div
        className="flex flex-grow flex-col overflow-auto text-sm"
        // By making sure there is always a fraction of an item showing we show
        // that there is more to scroll to "beyond the fold"
        style={{ maxHeight: COMMAND_HEIGHT * ITEMS_TO_SHOW }}
      >
        {shownCommands.map((command: Command, index: number) => (
          <CommandButton active={index == activeIndex} command={command} key={command.label} />
        ))}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    hasReactComponents: selectors.hasReactComponents(state),
  }),
  {
    hideCommandPalette: actions.hideCommandPalette,
    executeCommand: actions.executeCommand,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommandPalette);

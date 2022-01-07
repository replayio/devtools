import React, { ChangeEvent, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions, UIStore } from "ui/actions";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { hasReactComponents } from "ui/reducers/reactDevTools";
import { UIState } from "ui/state";
import { UserSettings } from "ui/types";
import { TextInput } from "../shared/Forms";
import Modal from "../shared/NewModal";
import CommandButton from "./CommandButton";
const { filter } = require("fuzzaldrin-plus");

export type Command = {
  key: CommandKey;
  label: string;
  shortcut?: string;
  settingKey?: keyof UserSettings;
};
export type CommandKey =
  | "show_console_filters"
  | "open_viewer"
  | "open_devtools"
  | "open_file_search"
  | "open_function_search"
  | "open_full_text_search"
  | "open_sources"
  | "open_outline"
  | "open_print_statements"
  | "open_console"
  | "open_react_devtools"
  | "show_privacy"
  | "show_comments"
  | "show_replay_info"
  | "show_events"
  | "open_network_monitor"
  | "open_elements"
  | "show_sharing";

const COMMANDS: Command[] = [
  { key: "open_viewer", label: "Open Viewer" },
  { key: "open_devtools", label: "Open DevTools" },
  { key: "open_file_search", label: "Search for file", shortcut: "CmdOrCtrl+P" },
  { key: "open_function_search", label: "Search for a function", shortcut: "CmdOrCtrl+Shift+P" },
  { key: "open_full_text_search", label: "Open Full Text Search", shortcut: "CmdOrCtrl+Shift+F" },
  { key: "open_sources", label: "Open Sources" },
  { key: "open_outline", label: "Open Outline" },
  { key: "open_print_statements", label: "Open Print Statements" },
  { key: "open_console", label: "Open Console" },
  {
    key: "open_network_monitor",
    label: "Open Network Monitor",
    settingKey: "enableNetworkMonitor",
  },
  { key: "open_elements", label: "Open Elements", settingKey: "showElements" },
  { key: "open_react_devtools", label: "Open React DevTools", settingKey: "showReact" },
  { key: "show_comments", label: "Show Comments" },
  { key: "show_privacy", label: "Show Privacy" },
  { key: "show_replay_info", label: "Show Replay Info" },
  { key: "show_events", label: "Show Events" },
  { key: "show_sharing", label: "Show Sharing Options" },
  { key: "show_console_filters", label: "Show Console Filters" },
];

function getShownCommands(searchString: string, hasReactComponents: boolean) {
  const { userSettings } = hooks.useGetUserSettings();

  const enabledCommands = COMMANDS.filter(command => {
    if (command.settingKey) {
      const isEnabled = userSettings[command.settingKey];

      if (command.key === "open_react") {
        return isEnabled && hasReactComponents;
      }

      return isEnabled;
    }

    return true;
  });

  return searchString ? filter(enabledCommands, searchString, { key: "label" }) : enabledCommands;
}

function CommandPalette({
  hideCommandPalette,
  executeCommand,
  hasReactComponents,
}: PropsFromRedux) {
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
      const nextIndex = (index + resultCount) % resultCount || 0;
      setActiveIndex(nextIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(shownCommands[activeIndex].key);
    }
  };

  return (
    <Modal
      blurMask={false}
      options={{ maskTransparency: "translucent" }}
      onMaskClick={() => hideCommandPalette()}
    >
      <div
        className="h-64 flex flex-col overflow-hidden rounded-md bg-gray-50 shadow-xl"
        style={{ width: "480px" }}
      >
        <div className="p-3 border-b border-gray-300">
          <TextInput
            value={searchString}
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="What would you like to do?"
            textSize="lg"
          />
        </div>
        <div className="flex-grow text-sm flex flex-col overflow-auto">
          {shownCommands.map((command: Command, index: number) => (
            <CommandButton active={index == activeIndex} command={command} key={command.label} />
          ))}
        </div>
      </div>
    </Modal>
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

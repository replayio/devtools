import React, { ChangeEvent, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { TextInput } from "../shared/Forms";
import Modal from "../shared/NewModal";
import CommandButton from "./CommandButton";
const { filter } = require("fuzzaldrin-plus");

export type Command = { key: CommandKey; label: string; shortcut: string };
export type CommandKey =
  | "open_viewer"
  | "open_devtools"
  | "open_full_text_search"
  | "open_sources"
  | "open_outline"
  | "open_print_statements"
  | "open_console"
  | "show_privacy"
  | "show_sharing";

const COMMANDS: Command[] = [
  { key: "open_viewer", label: "Open Viewer", shortcut: "CMd+V" },
  { key: "open_devtools", label: "Open DevTools", shortcut: "" },
  { key: "open_full_text_search", label: "Open Full Text Search", shortcut: "" },
  { key: "open_sources", label: "Open Sources", shortcut: "" },
  { key: "open_outline", label: "Open Outline", shortcut: "" },
  { key: "open_print_statements", label: "Open Print Statements", shortcut: "" },
  { key: "open_console", label: "Open Console", shortcut: "" },
  { key: "show_privacy", label: "Show Privacy Information", shortcut: "" },
  { key: "show_sharing", label: "Show Sharing Options", shortcut: "" },

  // Things that should probably done in a separate pass.
  // { label: "Open React DevTools", shortcut: "" },
  // { label: "Open Elements", shortcut: "" },
  // { label: "Open Event Breakpoints", shortcut: "" },
  // { label: "Show shortcuts", shortcut: "" },
  // { label: "Add a comment", shortcut: "" },
];

function CommandPalette({ hideCommandPalette }: PropsFromRedux) {
  const [searchString, setSearchString] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };
  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log({ e });
    if (e.key === "Escape") {
      hideCommandPalette();
    }
  };

  const shownCommands = searchString ? filter(COMMANDS, searchString, { key: "label" }) : COMMANDS;

  return (
    <Modal
      blurMask={false}
      options={{ maskTransparency: "translucent" }}
      onMaskClick={() => hideCommandPalette()}
    >
      <div className="w-96 h-64 flex flex-col overflow-hidden rounded-md bg-gray-100 shadow-xl ">
        <div className="p-2 border-b border-gray-300" onKeyPress={onKeyPress}>
          <TextInput
            value={searchString}
            onChange={onChange}
            autoFocus
            placeholder="What would you like to do?"
          />
        </div>
        <div className="flex-grow text-sm flex flex-col overflow-auto">
          {shownCommands.map((command: Command) => (
            <CommandButton command={command} key={command.label} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

const connector = connect(null, {
  hideCommandPalette: actions.hideCommandPalette,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommandPalette);

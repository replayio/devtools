import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { Command } from "./CommandPalette";

type CommandButtonProps = PropsFromRedux & { command: Command; active: boolean };

function CommandButton({ command, executeCommand, active }: CommandButtonProps) {
  const { label, shortcut, key } = command;
  const onClick = () => {
    executeCommand(key);
  };

  const bgColors = active ? "bg-primaryAccent text-white" : "hover:bg-gray-200";

  return (
    <button
      key={label}
      onClick={onClick}
      className={`${bgColors} px-4 py-1 flex  justify-between transition`}
    >
      <div>{label}</div>
      {shortcut ? (
        <div className={`${active ? "text-white" : "text-gray-400"}`}>
          {formatKeyShortcut(shortcut)}
        </div>
      ) : null}
    </button>
  );
}

const connector = connect(null, {
  executeCommand: actions.executeCommand,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommandButton);

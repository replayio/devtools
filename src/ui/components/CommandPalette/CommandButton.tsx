import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { Command } from ".";

type CommandButtonProps = PropsFromRedux & { command: Command };

function CommandButton({ command, executeCommand }: CommandButtonProps) {
  const { label, shortcut, key } = command;
  const onClick = () => {
    executeCommand(key);
  };

  return (
    <button
      key={label}
      onClick={onClick}
      className="px-4 py-1 flex hover:bg-gray-200 justify-between transition"
    >
      <div>{label}</div>
      <div className="text-gray-400">{formatKeyShortcut(shortcut)}</div>
    </button>
  );
}

const connector = connect(null, {
  executeCommand: actions.executeCommand,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommandButton);

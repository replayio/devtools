import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import React, { useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { Command } from "./CommandPalette";

type CommandButtonProps = PropsFromRedux & { command: Command; active: boolean };

function CommandButton({ command, executeCommand, active }: CommandButtonProps) {
  const buttonNode = useRef<HTMLButtonElement | null>(null);
  const { label, shortcut, key } = command;
  const onClick = () => {
    executeCommand(key);
  };

  const bgColors = active ? "bg-primaryAccent text-white" : "hover:bg-gray-200";

  useEffect(() => {
    if (active && buttonNode.current) {
      buttonNode.current.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  return (
    <button
      key={label}
      onClick={onClick}
      className={`${bgColors} flex justify-between px-6 py-2 transition`}
      ref={buttonNode}
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

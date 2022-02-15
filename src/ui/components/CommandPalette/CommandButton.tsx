import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import React, { FC, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import cx from "classnames";
import { actions } from "ui/actions";
import { Command } from "./CommandPalette";

type CommandButtonProps = {
  command: Command;
  active: boolean;
};

const CommandButton: FC<CommandButtonProps> = ({ command, active }) => {
  const dispatch = useDispatch();

  const buttonNode = useRef<HTMLButtonElement | null>(null);
  const { label, shortcut, key } = command;
  const onClick = () => {
    dispatch(actions.executeCommand(key));
  };

  useEffect(() => {
    if (active && buttonNode.current) {
      buttonNode.current.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  return (
    <button
      key={label}
      onClick={onClick}
      className={cx(
        "flex justify-between px-6 py-2 transition",
        active ? "bg-primaryAccent text-white" : "hover:bg-gray-200"
      )}
      ref={buttonNode}
    >
      <div>{label}</div>
      {shortcut ? (
        <div className={active ? "text-white" : "text-gray-400"}>{formatKeyShortcut(shortcut)}</div>
      ) : null}
    </button>
  );
};

export default CommandButton;

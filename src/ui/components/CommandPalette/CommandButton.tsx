import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import React, { FC, useEffect, useRef } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import cx from "classnames";
import { actions } from "ui/actions";
import { Command } from "./CommandPalette";
import styles from "./CommandPalette.module.css";

type CommandButtonProps = {
  command: Command;
  active: boolean;
};

const CommandButton = ({ command, active }: CommandButtonProps) => {
  const dispatch = useAppDispatch();

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
        active ? styles.shortcutHover : styles.shortcut
      )}
      ref={buttonNode}
    >
      <div>{label}</div>
      {shortcut ? <div>{formatKeyShortcut(shortcut)}</div> : null}
    </button>
  );
};

export default CommandButton;

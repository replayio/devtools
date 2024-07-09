import classNames from "classnames";
import React, { useContext } from "react";

import { LoggablesContext } from "replay-next/components/console/LoggablesContext";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { shouldShowNag } from "ui/utils/tour";

import MaterialIcon from "../MaterialIcon";

// This is very arbitrary but we need it to keep the editor
// from running into overflow problems.
export const NAG_HEIGHT = "40px";
export const NAG_HAT_CLASS = "nag-hat";

function NagHat({
  mainText,
  subText,
  nagType,
}: {
  mainText?: string;
  subText: string;
  nagType: Nag;
}) {
  const { nags } = hooks.useGetUserInfo();

  if (!shouldShowNag(nags, nagType)) {
    return null;
  }

  return (
    <div
      className={classNames(
        NAG_HAT_CLASS,
        "flex hidden select-none items-center space-x-2 py-1 px-2 leading-tight text-white"
      )}
      style={{
        boxShadow: "rgb(184 0 89 / 50%) 0px 0px 4px inset",
        background:
          "linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF",
      }}
    >
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      <div className="flex flex-col overflow-hidden text-xs">
        {mainText ? (
          <div className="overflow-hidden overflow-ellipsis whitespace-pre">{mainText}</div>
        ) : null}
        <div className="overflow-hidden overflow-ellipsis whitespace-pre font-bold">{subText}</div>
      </div>
    </div>
  );
}

export function EditorNag() {
  const { nags } = hooks.useGetUserInfo();

  if (!nags) {
    return null;
  }

  return <NagHat subText="Next, hover on a line number" nagType={Nag.FIRST_PRINT_STATEMENT_ADD} />;
}

export function ConsoleNag() {
  const { loggables } = useContext(LoggablesContext);

  // Don't show the console nag that directs the user to click on one of the console messages
  // if there aren't any console messages to begin with.
  if (!loggables.length) {
    return null;
  }

  return (
    <NagHat
      mainText="Console time-travel:"
      subText="Try clicking on the arrow buttons in the console to jump forward or backward in time"
      nagType={Nag.FIRST_CONSOLE_NAVIGATE}
    />
  );
}

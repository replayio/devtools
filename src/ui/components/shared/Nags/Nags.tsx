import classNames from "classnames";
import React from "react";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { shouldShowNag } from "ui/utils/user";
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
  mainText: string;
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
        "text-white py-1 px-2 flex space-x-2 items-center leading-tight select-none"
      )}
      style={{
        boxShadow: "rgb(184 0 89 / 50%) 0px 0px 4px inset",
        background:
          "linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF",
      }}
    >
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      <div className="text-xs flex flex-col overflow-hidden">
        <div className="overflow-hidden overflow-ellipsis whitespace-pre">{mainText}</div>
        <div className="font-bold overflow-hidden overflow-ellipsis whitespace-pre">{subText}</div>
      </div>
    </div>
  );
}

export function EditorNag() {
  const { nags } = hooks.useGetUserInfo();

  if (!nags) {
    return null;
  }

  return (
    <NagHat
      mainText="Ready to add your first print statement?"
      subText="Click on a line number in the gutter"
      nagType={Nag.FIRST_BREAKPOINT_ADD}
    />
  );
}

export function ConsoleNag() {
  return (
    <NagHat
      mainText="Want to see something cool?"
      subText="Try fast forwarding or rewinding to a console log"
      nagType={Nag.FIRST_CONSOLE_NAVIGATE}
    />
  );
}

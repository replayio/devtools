import React from "react";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import MaterialIcon from "../MaterialIcon";

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
  const isAuthor = hooks.useUserIsAuthor();

  if (nags.includes(nagType) || !isAuthor) {
    return null;
  }

  return (
    <div className="bg-secondaryAccent text-white py-1 px-2 flex space-x-2 items-center leading-tight">
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      <div className="text-xs flex flex-col">
        <div>{mainText}</div>
        <div className="font-bold">{subText}</div>
      </div>
    </div>
  );
}

export function EditorNag() {
  const { nags } = hooks.useGetUserInfo();

  // Don't show the editor nag until the user has gotten past the
  // console navigate nag.
  if (!nags.includes(Nag.FIRST_CONSOLE_NAVIGATE)) {
    return null;
  }

  return (
    <NagHat
      mainText="Ready to add your first print statement?"
      subText="Click on a line number in the gutter"
      nagType={Nag.FIRST_GUTTER_CLICK}
    />
  );
}

export function ConsoleNag() {
  return (
    <NagHat
      mainText="Check out our best feature"
      subText="Try playing to one of our console logs"
      nagType={Nag.FIRST_CONSOLE_NAVIGATE}
    />
  );
}

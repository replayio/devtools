import React, { useEffect, useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";

const TEXT = {
  clickPrompt: "Edit your first print statement",
  enterPrompt: "Add some local variables",
  success: "Check the console",
};

type Step = keyof typeof TEXT;

function getStep(nags: Nag[], editing: boolean): Step | void {
  if (!nags) {
    return undefined;
  }

  if (!nags.includes(Nag.FIRST_BREAKPOINT_ADD)) {
    return "clickPrompt";
  }

  if (editing && !nags.includes(Nag.FIRST_BREAKPOINT_EDIT)) {
    return "enterPrompt";
  }

  if (!nags.includes(Nag.FIRST_BREAKPOINT_REMOVED)) {
    return "success";
  }

  return undefined;
}

export default function FirstEditNag({ editing }: { editing: boolean }) {
  const { nags } = hooks.useGetUserInfo();

  const step = getStep(nags, editing);

  if (!step) {
    return null;
  }

  return (
    <div
      className="bg-secondaryAccent text-white py-1 px-2 flex space-x-2 items-center leading-tight rounded-t-md font-sans"
      style={{
        background:
          "linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF",
      }}
    >
      <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
      <div className="text-xs font-bold">{TEXT[step]}</div>
    </div>
  );
}

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

function FirstEditNag({ editing, nags }: { editing: boolean; nags: Nag[] }) {
  const [step, setStep] = useState<Step>("clickPrompt");
  const updateUserNags = hooks.useUpdateUserNags();

  useEffect(() => {
    if (step === "clickPrompt") {
      if (editing) {
        setStep("enterPrompt");
      }
    } else if (step === "enterPrompt") {
      if (!editing) {
        setStep("success");
        const newNags = [...nags, Nag.FIRST_BREAKPOINT_EDIT];
        updateUserNags({
          variables: { newNags },
        });
      }
    }
  }, [editing]);

  if (nags?.includes(Nag.FIRST_BREAKPOINT_EDIT)) {
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

// This saves a snapshot of the user's nags locally before rendering the FirstEditNag
// component. This way, the nag UI doesn't disappear immediately after the user dismisses
// the first edit nag.
export default function FirstEditNagWrapper({ editing }: { editing: boolean }) {
  const { nags } = hooks.useGetUserInfo();
  const [localNags, setLocalNags] = useState<Nag[] | null>(null);

  useEffect(() => {
    if (nags && !localNags) {
      setLocalNags(nags);
    }
  }, [nags]);

  if (!localNags) {
    return null;
  }

  return <FirstEditNag editing={editing} nags={localNags} />;
}

import React, { useEffect, useState } from "react";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
// import "./FirstEditNag.css";

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
    <div className="first-edit-nag p-2 py-1 text-white font-sans text-xs flex flex-row items-center space-x-1">
      <img src="/images/sparkle.svg" className="w-3" />
      <span>{TEXT[step]}</span>
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

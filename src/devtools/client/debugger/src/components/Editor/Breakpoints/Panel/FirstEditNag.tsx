import React, { useEffect, useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { shouldShowNag } from "ui/utils/user";

const TEXT = {
  editPrompt: "Edit your first print statement",
  savePrompt: "Add some local variables",
  success: "Check the console",
};

type Step = keyof typeof TEXT;

export default function FirstEditNag({ editing }: { editing: boolean }) {
  const [step, setStep] = useState<Step | null>(null);
  const { nags } = hooks.useGetUserInfo();

  useEffect(() => {
    if (shouldShowNag(nags, Nag.FIRST_BREAKPOINT_EDIT)) {
      setStep("editPrompt");
    } else if (editing && shouldShowNag(nags, Nag.FIRST_BREAKPOINT_SAVE)) {
      setStep("savePrompt");
    }

    // Show the user the success state if they've just finished saving the breakpoint.
    if (step === "savePrompt" && !shouldShowNag(nags, Nag.FIRST_BREAKPOINT_SAVE)) {
      setStep("success");
    }
  }, [nags, editing]);

  if (!step) {
    return null;
  }

  return (
    <div
      className="flex items-center space-x-2 rounded-t-md bg-secondaryAccent py-1 px-2 font-sans leading-tight text-white"
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

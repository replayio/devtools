import { PrimaryButton, SecondaryButton } from "../Button";
import { Dialog } from "../Dialog";
import React, { HTMLProps } from "react";
import ReplayLogo from "../ReplayLogo";

export type ConfirmOptions = {
  acceptLabel: string;
  declineLabel: string;
  description?: string;
  message: string;
  onAccept: () => void;
  onDecline: () => void;
  variation?: "normal" | "destructive";
};

type PropTypes = ConfirmOptions & HTMLProps<HTMLDivElement>;

export const ConfirmDialog = ({
  acceptLabel,
  declineLabel,
  description,
  message,
  onAccept,
  onDecline,
  variation = "normal",
}: PropTypes) => {
  return (
    <Dialog
      className="flex flex-col items-center"
      style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
    >
      <ReplayLogo size="sm" />
      <h1 className="text-center text-lg font-medium mt-5">{message}</h1>
      {description && <p className="mt-2 text-center text-gray-500 text-xs">{description}</p>}
      <div className="mt-6 flex w-full">
        <SecondaryButton color="blue" className="m-3 flex-1 justify-center" onClick={onDecline}>
          {declineLabel}
        </SecondaryButton>
        <PrimaryButton
          className="m-3 flex-1 justify-center"
          color={variation === "destructive" ? "red" : "blue"}
          onClick={onAccept}
        >
          {acceptLabel}
        </PrimaryButton>
      </div>
    </Dialog>
  );
};

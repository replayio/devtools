import { PrimaryButton, SecondaryButton } from "../Button";
import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogLogo,
  DialogPropTypes,
  DialogTitle,
} from "../Dialog";
import React, { HTMLProps } from "react";
import classNames from "classnames";

export type ConfirmOptions = {
  acceptLabel: string;
  declineLabel?: string;
  description?: string;
  message: string;
  onAccept: () => void;
  onDecline: () => void;
  variation?: "normal" | "destructive";
};

type PropTypes = ConfirmOptions & DialogPropTypes;

export const ConfirmDialog = ({
  acceptLabel,
  className,
  declineLabel = "Cancel",
  description,
  message,
  onAccept,
  onDecline,
  variation = "normal",
  ...props
}: PropTypes) => {
  return (
    <Dialog
      {...props}
      className={classNames("flex flex-col items-center", className)}
      style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
    >
      <DialogLogo />
      <DialogTitle>{message}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
      <DialogActions>
        <SecondaryButton color="blue" className="flex-1 mx-3 justify-center" onClick={onDecline}>
          {declineLabel}
        </SecondaryButton>
        <PrimaryButton
          className="flex-1 mx-2 justify-center"
          color={variation === "destructive" ? "red" : "blue"}
          onClick={onAccept}
        >
          {acceptLabel}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

import { Button, SecondaryButton } from "../Button";
import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogLogo,
  DialogPropTypes,
  DialogTitle,
} from "../Dialog";
import React, { useEffect, useRef } from "react";
import classNames from "classnames";

export type ConfirmOptions = {
  acceptLabel: string;
  declineLabel?: string;
  description?: string;
  isDestructive?: boolean;
  message: string;
  onAccept: () => void;
  onDecline: () => void;
};

type PropTypes = ConfirmOptions & DialogPropTypes;

export const ConfirmDialog = ({
  acceptLabel,
  className,
  declineLabel = "Cancel",
  description,
  message,
  isDestructive = false,
  onAccept,
  onDecline,
  ...props
}: PropTypes) => {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevActiveElement = document.activeElement;
    primaryButtonRef.current?.focus();
    return () => {
      if (prevActiveElement instanceof HTMLElement) {
        prevActiveElement.focus();
      }
    };
  }, []);

  return (
    <Dialog
      {...props}
      className={className}
      onKeyUp={evt => {
        if (evt.key === "Escape") {
          evt.stopPropagation();
          onDecline();
        }
      }}
    >
      <DialogLogo />
      <DialogTitle>{message}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
      <DialogActions>
        <SecondaryButton color="blue" className="mx-3 flex-1 justify-center" onClick={onDecline}>
          {declineLabel}
        </SecondaryButton>
        <Button
          className="mx-2 flex-1 justify-center"
          color={isDestructive ? "pink" : "blue"}
          onClick={onAccept}
          ref={primaryButtonRef}
          size="md"
          style="primary"
        >
          {acceptLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

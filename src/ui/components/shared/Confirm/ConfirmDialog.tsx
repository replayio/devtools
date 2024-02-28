import { useEffect, useRef } from "react";

import { Button } from "replay-next/components/Button";

import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogLogo,
  DialogPropTypes,
  DialogTitle,
} from "../Dialog";

export type ConfirmOptions = {
  acceptLabel: string;
  dataTestId?: string;
  dataTestName?: string;
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
  dataTestId,
  dataTestName,
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
      dataTestId={dataTestId}
      dataTestName={dataTestName}
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
        <Button
          data-test-id={dataTestId ? `${dataTestId}-DeclineButton` : undefined}
          data-test-name={dataTestName ? `${dataTestName}-DeclineButton` : undefined}
          onClick={onDecline}
        >
          {declineLabel}
        </Button>
        <Button
          className="mx-2 flex-1 justify-center"
          color={isDestructive ? "secondary" : "primary"}
          data-test-id={dataTestId ? `${dataTestId}-ConfirmButton` : undefined}
          data-test-name={dataTestName ? `${dataTestName}-ConfirmButton` : undefined}
          onClick={onAccept}
          ref={primaryButtonRef}
        >
          {acceptLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

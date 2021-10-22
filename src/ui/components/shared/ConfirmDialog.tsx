import { omit, uniqueId } from "lodash";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { PrimaryButton, SecondaryButton } from "./Button";
import { Dialog } from "./Dialog";
import Modal from "./NewModal";
import ReplayLogo from "./ReplayLogo";

type ConfirmOptions = {
  message: string;
  description?: string;
  acceptLabel: string;
  declineLabel: string;
  variation?: "normal" | "destructive";
};

type PropTypes = ConfirmOptions & {
  onAccept: () => void;
  onDecline: () => void;
};

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
    <Modal
      onMaskClick={onDecline}
      options={{ maskTransparency: "translucent" }}
      style={{ zIndex: 100 }}
    >
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
    </Modal>
  );
};

const ConfirmContext = createContext<{
  confirmations: { [id: number]: PropTypes };
  showConfirmation: (options: PropTypes) => void;
}>({
  confirmations: {},
  showConfirmation: () => {
    console.warn("Missing ConfirmContext.Provider");
  },
});

export const useConfirm = () => {
  const { showConfirmation } = useContext(ConfirmContext);
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      showConfirmation({
        ...options,
        onAccept: () => resolve(true),
        onDecline: () => resolve(false),
      });
    });
  }
  return {
    confirm,
    confirmDestructive: (options: ConfirmOptions) => {
      return confirm({ ...options, variation: "destructive" });
    },
  };
};

export const ConfirmRenderer = ({
  element = document.getElementById("app"),
}: {
  element?: HTMLElement | null;
}) => {
  if (!element) {
    return null;
  }

  const { confirmations } = useContext(ConfirmContext);
  return (
    <>
      {Object.entries(confirmations).map(([id, options]) =>
        createPortal(<ConfirmDialog key={id} {...options} />, element)
      )}
    </>
  );
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmations, setConfirmations] = useState<{ [id: number]: PropTypes }>({});

  const showConfirmation = useCallback((confirmation: PropTypes) => {
    const id = uniqueId("confirm-");
    const removeConfirmation = () => setConfirmations(c => omit(c, id));
    setConfirmations(c => ({
      ...c,
      [id]: {
        ...confirmation,
        onAccept() {
          removeConfirmation();
          confirmation.onAccept();
        },
        onDecline() {
          removeConfirmation();
          confirmation.onDecline();
        },
      },
    }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirmations, showConfirmation }}>
      {children}
      <ConfirmRenderer />
    </ConfirmContext.Provider>
  );
};

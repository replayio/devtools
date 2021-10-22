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
}: PropTypes) => {
  return (
    <Modal onMaskClick={onDecline} options={{ maskTransparency: "translucent" }}>
      <Dialog
        className="align-center"
        style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
      >
        <ReplayLogo size="sm" />
        <h1 className="text-lg font-medium mt-5">{message}</h1>
        {description && <p className="mb-2 text-gray-500 text-xs">{description}</p>}
        <div className="mt-6" style={{ display: "flex", justifyContent: "stretch" }}>
          <SecondaryButton color="blue" className="m-3" onClick={onDecline}>
            {declineLabel}
          </SecondaryButton>
          <PrimaryButton className="m-3" color="blue" onClick={onAccept}>
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
  return function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      showConfirmation({
        ...options,
        onAccept: () => resolve(true),
        onDecline: () => resolve(false),
      });
    });
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
  console.info("render confirms", confirmations);
  return (
    <>
      {Object.entries(confirmations).map(([id, options]) =>
        createPortal(<ConfirmDialog id={id} key={id} {...options} />, element)
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

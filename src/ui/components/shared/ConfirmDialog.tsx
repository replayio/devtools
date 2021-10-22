import { resolve } from "@sentry/utils";
import { omit, uniqueId } from "lodash";
import { number } from "prop-types";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "./Dialog";
import Modal from "./NewModal";

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

export const ConfirmDialog = ({ onDecline }: PropTypes) => {
  console.info("Dialog!");
  return (
    <Modal onMaskClick={onDecline}>
      <Dialog>
        <h1>Testing!</h1>
      </Dialog>
    </Modal>
  );
};

const ConfirmContext = createContext<{
  confirmations: { [id: number]: PropTypes };
  showConfirmation: (options: PropTypes) => void;
}>({ confirmations: {}, showConfirmation: () => {} });

export const useConfirm = () => {
  const { showConfirmation } = useContext(ConfirmContext);
  return function confirm(options: ConfirmOptions): Promise<boolean> {
    console.info("do confirm", options);
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
  console.info("ConfirmRenderer", confirmations);
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
          confirmation.onAccept();
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

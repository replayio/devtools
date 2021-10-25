import { omit, uniqueId } from "lodash";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog, ConfirmOptions } from "./ConfirmDialog";

const ConfirmContext = createContext<{
  confirmations: { [id: number]: ConfirmOptions };
  showConfirmation: (options: ConfirmOptions) => void;
}>({
  confirmations: {},
  showConfirmation: () => {
    console.warn("Missing ConfirmContext.Provider");
  },
});

type ConfirmHook = (options: Omit<ConfirmOptions, "onAccept" | "onDecline">) => Promise<boolean>;
export const useConfirm = () => {
  const { showConfirmation } = useContext(ConfirmContext);

  const confirm: ConfirmHook = useCallback(
    (options: Omit<ConfirmOptions, "onAccept" | "onDecline">): Promise<boolean> => {
      return new Promise(resolve => {
        showConfirmation({
          ...options,
          onAccept: () => resolve(true),
          onDecline: () => resolve(false),
        });
      });
    },
    [showConfirmation]
  );

  const confirmDestructive: ConfirmHook = useCallback(
    options => confirm({ ...options, variation: "destructive" }),
    [confirm]
  );

  return {
    confirm,
    confirmDestructive,
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
  const [confirmations, setConfirmations] = useState<{ [id: number]: ConfirmOptions }>({});

  const showConfirmation = useCallback(
    (confirmation: ConfirmOptions) => {
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
    },
    [setConfirmations]
  );

  return (
    <ConfirmContext.Provider value={{ confirmations, showConfirmation }}>
      {children}
      <ConfirmRenderer />
    </ConfirmContext.Provider>
  );
};

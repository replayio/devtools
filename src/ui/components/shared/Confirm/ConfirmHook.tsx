import omit from "lodash/omit";
import uniqueId from "lodash/uniqueId";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { ConfirmOptions } from "./ConfirmDialog";
import { ConfirmModal } from "./ConfirmModal";

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
    options => confirm({ ...options, isDestructive: true }),
    [confirm]
  );

  return {
    confirm,
    confirmDestructive,
  };
};

export const ConfirmRenderer = () => {
  const [element, setElement] = useState<HTMLElement | null>();
  const { confirmations } = useContext(ConfirmContext);

  useEffect(() => {
    if (!element) {
      setElement(document.getElementById("__next"));
    }
  }, [element]);

  if (!element) {
    return null;
  }

  return (
    <>
      {Object.entries(confirmations).map(([id, options]) =>
        createPortal(<ConfirmModal key={id} {...options} />, element)
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
    </ConfirmContext.Provider>
  );
};

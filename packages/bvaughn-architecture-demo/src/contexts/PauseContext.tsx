import { PauseId } from "@replayio/protocol";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";

export type PauseContextType = {
  isPending: boolean;
  pauseId: PauseId | null;
  update: (pauseId: PauseId | null) => void;
};

export const PauseContext = createContext<PauseContextType>(null as any);

export function PauseContextRoot({ children }: PropsWithChildren<{}>) {
  const [pauseId, setPauseId] = useState<PauseId | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = useCallback((pauseId: PauseId | null) => {
    // Components might suspend in response to the pauseId changing.
    startTransition(() => {
      setPauseId(pauseId);
    });
  }, []);

  const context = useMemo(() => ({ isPending, pauseId, update }), [isPending, pauseId, update]);

  return <PauseContext.Provider value={context}>{children}</PauseContext.Provider>;
}

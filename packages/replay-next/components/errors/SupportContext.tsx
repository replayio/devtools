import { PropsWithChildren, ReactNode, createContext, useCallback, useMemo, useState } from "react";

import { SupportForm } from "replay-next/components/errors/SupportForm";

export type SupportFormContext = {
  id: string;
  [key: string]: any;
};

export type State = {
  context: SupportFormContext;
  promptText: string;
  title: ReactNode;
};

export const SupportContext = createContext<{
  hideSupportForm: () => void;
  showSupportForm: (state: State) => void;
  state: State | null;
}>(null as any);

export function SupportContextRoot({ children }: PropsWithChildren) {
  const [state, setState] = useState<State | null>(null);

  const hideSupportForm = useCallback(() => setState(null), []);
  const showSupportForm = useCallback((state: State) => setState(state), []);

  const value = useMemo(
    () => ({
      hideSupportForm,
      showSupportForm,
      state,
    }),
    [hideSupportForm, showSupportForm, state]
  );

  return (
    <SupportContext.Provider value={value}>
      {children}
      {state && <SupportForm dismiss={hideSupportForm} state={state} />}
    </SupportContext.Provider>
  );
}

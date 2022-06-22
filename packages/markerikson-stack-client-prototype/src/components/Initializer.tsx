// This file is not really part of the architectural demo.
// It's just a bootstrap for things like auth that I didn't want to spend time actually implementing.

import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import asyncInitializeClient from "../client/asyncInitializeClient";
import { SessionContext, SessionContextType } from "../contexts/SessionContext";

// HACK Hack around the fact that the initSocket() function is side effectful
// and writes to an "app" global on the window object.
if (typeof window !== "undefined") {
  (window as any).app = {
    prefs: {},
  };
}

export default function Initializer({ children }: { children: ReactNode }) {
  const replayClient = useContext(ReplayClientContext);
  const [context, setContext] = useState<SessionContextType | null>(null);
  const didInitializeRef = useRef<boolean>(false);

  useEffect(() => {
    // The WebSocket and session/authentication are global.
    // We only need to initialize them once.
    if (!didInitializeRef.current) {
      asyncInitializeClient(replayClient).then(sessionData => {
        setContext(sessionData);
      });
    }

    didInitializeRef.current = true;
  }, [replayClient]);

  if (context === null) {
    return null;
  }

  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}

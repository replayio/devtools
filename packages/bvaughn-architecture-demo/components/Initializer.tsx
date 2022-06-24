// This file is not really part of the architectural demo.
// It's just a bootstrap for things like auth that I didn't want to spend time actually implementing.

import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { SessionContext, SessionContextType } from "../src/contexts/SessionContext";
import { UserInfo } from "../src/graphql/types";
import { getCurrentUserInfo } from "../src/graphql/User";
import { preCacheSources } from "../src/suspense/SourcesCache";

// HACK Hack around the fact that the initSocket() function is side effectful
// and writes to an "app" global on the window object.
if (typeof window !== "undefined") {
  (window as any).app = {
    prefs: {},
  };
}

export default function Initializer({ children }: { children: ReactNode }) {
  const client = useContext(ReplayClientContext);
  const [context, setContext] = useState<SessionContextType | null>(null);
  const didInitializeRef = useRef<boolean>(false);

  useEffect(() => {
    // The WebSocket and session/authentication are global.
    // We only need to initialize them once.
    if (!didInitializeRef.current) {
      const asyncInitialize = async () => {
        // Read some of the hard-coded values from query params.
        // (This is just a prototype; no sense building a full authentication flow.)
        const url = new URL(window.location.href);
        const accessToken = url.searchParams.get("accessToken");
        const recordingId = url.searchParams.get("recordingId");
        if (!recordingId) {
          throw Error(`Must specify "recordingId" parameter.`);
        }

        const sessionId = await client.initialize(recordingId, accessToken);
        const endpoint = await client.getSessionEndpoint(sessionId);

        // The demo doesn't use these directly, but the client throws if they aren't loaded.
        const sources = await client.findSources();
        preCacheSources(sources);

        let currentUserInfo: UserInfo | null = null;
        if (accessToken) {
          currentUserInfo = await getCurrentUserInfo(accessToken);
        }

        setContext({
          accessToken: accessToken || null,
          currentUserInfo,
          duration: endpoint.time,
          endPoint: endpoint.point,
          recordingId,
          sessionId,
        });
      };

      asyncInitialize();
    }

    didInitializeRef.current = true;
  }, [client]);

  if (context === null) {
    return null;
  }

  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}

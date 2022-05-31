// This file is not really part of the architectural demo.
// It's just a bootstrap for things like auth that I didn't want to spend time actually implementing.

import { client, initSocket } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { ReactNode, useEffect, useRef, useState } from "react";

import { SessionContext } from "../src/contexts";

const DISPATCH_URL = "wss://dispatch.replay.io";

// HACK Hack around the fact that the initSocket() function is side effectful
// and writes to an "app" global on the window object.
if (typeof window !== "undefined") {
  (window as any).app = {
    prefs: {},
  };
}

type ContextType = { duration: number; endPoint: string; recordingId: string; sessionId: string };

export default function Initializer({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<ContextType | null>(null);
  const didInitializeRef = useRef<boolean>(false);

  useEffect(() => {
    // The WebSocket and session/authentication are global.
    // We only need to initialize them once.
    if (!didInitializeRef.current) {
      const asyncInitialize = async () => {
        initSocket(DISPATCH_URL);

        // Read some of the hard-coded values from query params.
        // (This is just a prototype; no sense building a full authentication flow.)
        const url = new URL(window.location.href);
        const accessToken = url.searchParams.get("accessToken");
        const recordingId = url.searchParams.get("recordingId");
        if (!recordingId) {
          throw Error(`Must specify "recordingId" parameter.`);
        }

        // Authenticate
        if (accessToken) {
          await client.Authentication.setAccessToken({ accessToken });
        }

        // Create session
        const { sessionId } = await client.Recording.createSession({ recordingId });
        const { endpoint } = await client.Session.getEndpoint({}, sessionId);

        // Pre-load sources for ValueFront usage later.
        ThreadFront.setSessionId(sessionId);
        // @ts-expect-error `sourceMapURL` doesn't exist?
        await ThreadFront.findSources(({ sourceId, url, sourceMapURL }) => {
          // Ignore
        });

        setContext({
          duration: endpoint.time,
          endPoint: endpoint.point,
          recordingId,
          sessionId,
        });
      };

      asyncInitialize();
    }

    didInitializeRef.current = true;
  }, []);

  if (context === null) {
    return null;
  }

  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}

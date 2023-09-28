import { useEffect } from "react";

import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";

export default function useAuthTelemetry() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const isAuthenticated = document.cookie
        .split(";")
        .filter(s => s.includes("auth0.is.authenticated"))
        .map(s => s.split("=")?.[1])
        .every(s => s === "true");

      let auth0Obj: Record<string, any> | null = null;

      for (let key in localStorage) {
        if (key.includes("auth0spajs")) {
          const value = localStorage.getItem(key);
          auth0Obj = value && (JSON.parse(value) as any);
        }
      }

      recordTelemetryData("auth-initial-state", {
        isAuthenticated,
        authId: auth0Obj?.body?.decodedToken?.user?.sub,
        hasRefreshToken: !!auth0Obj?.body?.refresh_token,
        expiresAt: auth0Obj?.expiresAt ? new Date(auth0Obj.expiresAt * 1000).toISOString() : null,
        expiresIn: auth0Obj?.body?.expires_in,
      });
    } catch {
      // no-op
    }
  }, []);
}

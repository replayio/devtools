import { LogoutOptions } from "@auth0/auth0-react";
import { requiresWindow } from "ssr";

declare global {
  var Intercom: any;
}

const APP_ID = "k7f741xx";

export function handleIntercomLogout(logout: (options?: LogoutOptions) => void) {
  requiresWindow(() => {
    window.Intercom("shutdown");
    logout({ returnTo: window.location.origin });
  });
}

export function bootIntercom(data: any) {
  requiresWindow(() => {
    window.Intercom("boot", { app_id: APP_ID, ...data });
  });
}

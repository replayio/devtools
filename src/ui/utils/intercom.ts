import { LogoutOptions } from "@auth0/auth0-react";

declare global {
  var Intercom: any;
}

const APP_ID = "k7f741xx";

export function handleIntercomLogout(logout: (options?: LogoutOptions) => void) {
  window.Intercom("shutdown");
  logout({ returnTo: window.location.origin });
}

export function bootIntercom(data: any) {
  window.Intercom("boot", { app_id: APP_ID, ...data });
}

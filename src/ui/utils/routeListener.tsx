import { useRouter } from "next/router";

let listenerInstalled = false;
let currentRoute: string | undefined;

export function InstallRouteListener() {
  const router = useRouter();
  if (!listenerInstalled) {
    currentRoute = window.location.pathname;

    router.events.on("routeChangeComplete", () => {
      const newRoute = location.pathname;
      if (currentRoute?.startsWith("/recording/") && newRoute === "/") {
        window.location.reload();
      }
      currentRoute = newRoute;
    });
  }

  return null;
}

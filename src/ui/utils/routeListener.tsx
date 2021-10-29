import { useHistory } from "react-router";

let listenerInstalled = false;
let currentRoute = window.location.pathname;

export function InstallRouteListener() {
  const history = useHistory();
  if (!listenerInstalled) {
    history.listen((location, action) => {
      const newRoute = location.pathname;
      if (currentRoute.startsWith("/recording/") && newRoute === "/") {
        window.location.reload();
      }
      currentRoute = newRoute;
    });
  }
}

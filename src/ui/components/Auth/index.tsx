import React, { useEffect } from "react";
import { matchPath, useHistory, useLocation } from "react-router-dom";
import { setUserInBrowserPrefs } from "../../utils/browser";

import useAuth from "ui/utils/auth/useAuth";

function Auth() {
  const { clerk } = useAuth();
  const { push } = useHistory();
  const location = useLocation();

  const match = matchPath(location.pathname, { path: ["/sign-in", "/sign-up"] });
  const mode = match && match.path.substring(1);

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  useEffect(() => {
    if (!mode) return;

    if (mode === "sign-in") {
      clerk.openSignIn();
    } else if (mode === "sign-up") {
      clerk.openSignUp();
    }

    const clearModal = (ev: KeyboardEvent) => {
      if (ev.code !== "Escape") return;

      push((location.state as any)?.previous || "/view");
    };
    document.addEventListener("keydown", clearModal);

    return () => {
      if (mode === "sign-in") {
        clerk.closeSignIn();
      } else if (mode === "sign-up") {
        clerk.closeSignUp();
      }

      document.removeEventListener("keydown", clearModal);
    };
  }, [mode, clerk]);

  return null;
}

export default Auth;
export { Auth };

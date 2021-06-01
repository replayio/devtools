import React, { useEffect } from "react";
import useAuth0 from "ui/utils/useAuth0";
import { setUserInBrowserPrefs } from "../../utils/browser";
import Library from "./Library";

import "./Account.css";
import "../Header/Header.css";
import "devtools/client/debugger/src/components/shared/AccessibleImage.css";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");
  const openedFromEmail = new URLSearchParams(window.location.search).get("emailinvite");

  if (forceOpenAuth) {
    loginWithRedirect();
    return null;
  }

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <main
      className="w-full h-full grid"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <section className="max-w-lg w-full m-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-16 h-84 space-y-12">
          <div className="space-y-4 place-content-center">
            <img className="w-16 h-16 mx-auto" src="images/logo.svg" />
          </div>
          {openedFromEmail ? (
            <div className="text-center space-y-2">
              <div className="font-bold text-2xl">Almost there!</div>
              <div className="font-medium text-xl">First we need you to sign in.</div>
            </div>
          ) : null}
          <a
            href="#"
            onClick={loginWithRedirect}
            className="w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-2xl font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in to Replay
          </a>
        </div>
      </section>
    </main>
  );
}

export default function Account() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return <Library />;
}

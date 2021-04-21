import React, { useEffect } from "react";
import useAuth0 from "ui/utils/useAuth0";
import { setUserInBrowserPrefs } from "../../utils/browser";
import Library from "./Library";

import "./Account.css";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");

  if (forceOpenAuth) {
    loginWithRedirect();
    return null;
  }

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <main className="w-full h-full bg-white grid">
      <section className="max-w-5xl w-full grid m-auto bg-white grid-cols-2 shadow-md rounded-lg overflow-hidden">
        <div className="p-16 h-96 space-y-12">
          <div className="space-y-4">
            <img className="w-16 h-16" src="images/logo.svg" />
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Welcome to Replay</h2>
          </div>
          <a
            href="#"
            onClick={loginWithRedirect}
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in
          </a>
        </div>
        <div
          className="h-96"
          style={{ background: "linear-gradient(to bottom right, #64D4FB, #52A6F9)" }}
        ></div>
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

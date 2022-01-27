import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Avatar from "ui/components/Avatar";
import { handleIntercomLogout } from "ui/utils/intercom";

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <button className="row logout" onClick={() => handleIntercomLogout(logout)}>
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-default leading-4 font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={() =>
        loginWithRedirect({
          appState: { returnTo: window.location.pathname + window.location.search },
        })
      }
      color="blue"
    >
      Sign In
    </button>
  );
};

export default LoginButton;

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
      onClick={() => loginWithRedirect({ appState: { returnTo: window.location.href } })}
      type="button"
      className="inline-flex items-center px-6 py-2 text-xl rounded-lg bg-primaryAccent hover:bg-primaryAccentHover text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent mr-0 sharebutton"
    >
      Sign In
    </button>
  );
};

export default LoginButton;

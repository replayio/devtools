import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Avatar from "ui/components/Avatar";

const LoginButton = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const logoutUrl = `${window.location.origin}/view`;

  if (isAuthenticated) {
    return (
      <button className="row logout" onClick={() => logout({ returnTo: logoutUrl })}>
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => loginWithRedirect({ appState: { returnTo: window.location.href } })}
      type="button"
      className="inline-flex items-center px-6 py-2 text-xl rounded-lg bg-primaryAccent hover:bg-primaryAccentHover text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent mr-0 defaultfont sharebutton"
    >
      Sign In
    </button>
  );
};

export default LoginButton;

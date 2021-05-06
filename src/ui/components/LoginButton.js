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
      className="inline-flex items-center px-6 py-2 border-2 border-bg-blue-100 text-xl rounded-xl text-black-700 bg-white hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-11 mr-0 defaultfont sharebutton"
    >
      Sign In
    </button>
  );
};

export default LoginButton;

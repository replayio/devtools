import React from "react";

import Avatar from "ui/components/Avatar";
import useAuth0 from "ui/utils/useAuth0";

const LoginButton = () => {
  const { loginAndReturn, isAuthenticated, logout, user } = useAuth0();

  if (isAuthenticated) {
    return (
      <button
        className="row logout"
        onClick={() => logout({ returnTo: window.location.origin + "/login" })}
      >
        <Avatar player={user} isFirstPlayer={true} />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      className="row logout"
      onClick={() => loginAndReturn()}
    >
      <span className="inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full justify-center">Sign In</span>
    </button>
  );
};

export default LoginButton;

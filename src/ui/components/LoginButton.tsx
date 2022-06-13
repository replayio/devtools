import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Avatar from "ui/components/Avatar";

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
      className="inline-flex items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 text-sm font-medium leading-4 text-white hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={() => loginAndReturn()}
      color="blue"
    >
      Sign In
    </button>
  );
};

export default LoginButton;

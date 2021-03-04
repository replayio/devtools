import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
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
    <button className="login" onClick={() => loginWithRedirect()}>
      Sign In
    </button>
  );
};

export default LoginButton;

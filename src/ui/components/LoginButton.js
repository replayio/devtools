import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const logoutUrl = `${window.location.origin}/view`;

  if (isAuthenticated) {
    return (
      <button className="logout" onClick={() => logout({ returnTo: logoutUrl })}>
        Sign Out
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

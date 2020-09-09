import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import "./LoginButton.css";

const LoginButton = () => {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return (
      <div className="user-account">
        <button onClick={() => logout({ returnTo: window.location.href })}>Log Out</button>
      </div>
    );
  }

  return (
    <div className="user-account">
      <button onClick={() => loginWithRedirect()}>Log In</button>{" "}
    </div>
  );
};

export default LoginButton;

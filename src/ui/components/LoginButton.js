import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@clerk/clerk-react";

const LoginButton = () => {
  const user = useUser();
  const logoutUrl = `${window.location.origin}/view`;

  if (user) {
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

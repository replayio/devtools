import React from "react";
import useAuth0 from "ui/utils/useAuth0";
import Library from "./Library";
import LoginPage from "./LoginPage";

import "./Account.css";

export default function Account() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Library />;
}

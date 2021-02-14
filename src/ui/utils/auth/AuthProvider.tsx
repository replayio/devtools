import React, { useRef } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useHistory, useLocation } from "react-router-dom";

import { pushModal } from "../routing";

const clerkFrontendApi = "clerk.xopvv.ianev.lcl.dev";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const history = useHistory();
  const location = useLocation();
  const ref = useRef(location);
  ref.current = location;

  return (
    <ClerkProvider
      frontendApi={clerkFrontendApi}
      navigate={to => {
        return pushModal(to, history, ref.current);
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default AuthProvider;

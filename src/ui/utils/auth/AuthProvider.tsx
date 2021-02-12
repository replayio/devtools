import React, { useRef } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useHistory, useLocation } from "react-router-dom";

const clerkFrontendApi = "clerk.xopvv.ianev.lcl.dev";

function pushModal(to: string, history: any, location: any) {
  const previous = location?.state?.previous;
  if (location.state?.modal) {
    history.replace(to, { modal: true, previous });
  } else {
    history.push(to, { modal: true, previous: location });
  }
}

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

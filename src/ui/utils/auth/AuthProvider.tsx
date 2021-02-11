import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useHistory } from "react-router-dom";

const clerkFrontendApi = "clerk.xopvv.ianev.lcl.dev";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { push } = useHistory();
  return (
    <ClerkProvider
      frontendApi={clerkFrontendApi}
      navigate={to => {
        return push(to);
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default AuthProvider;

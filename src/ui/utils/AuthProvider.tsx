import React, { useEffect } from "react";
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useHistory } from "react-router-dom";

// Replace with your instance settings
const clerkFrontendApi = "clerk.xopvv.ianev.lcl.dev";
const clerkSignInURL = "https://accounts.xopvv.ianev.lcl.dev/sign-in";

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

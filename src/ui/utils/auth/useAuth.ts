import { LoadedClerkI, useClerk } from "@clerk/clerk-react";

const useAuth = () => {
  let clerk: Pick<LoadedClerkI, "user" | "session">;
  try {
    // Clerk complains about using this before it can guarantee the client has
    // loaded. This try/catch appears safe as long as it is used within the
    // Clerk provider which re-renders when it has set up.
    clerk = useClerk();
  } catch (e) {
    clerk = {
      user: null,
      session: null,
    };
  }

  return {
    user: clerk.user,
    isAuthenticated: !!clerk.session,
    clerk: clerk as any,
  };
};

export default useAuth;
export { useAuth };

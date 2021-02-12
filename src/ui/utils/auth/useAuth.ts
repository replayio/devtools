import { LoadedClerkI, useClerk } from "@clerk/clerk-react";
const useAuth = () => {
  const clerk = useClerk();

  return {
    clerk,
    isAuthenticated: !!clerk.session,
    user: clerk.user,
  };
};

export default useAuth;
export { useAuth };

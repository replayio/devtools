import { useClerk } from "@clerk/clerk-react";

const useAuth = () => {
  const clerk = useClerk();

  return {
    user: clerk.user,
    isAuthenticated: !!clerk.session,
  };
};

export default useAuth;
export { useAuth };

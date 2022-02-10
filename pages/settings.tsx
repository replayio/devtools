import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SettingsRedirectPage(): React.ReactNode {
  const { replace } = useRouter();

  useEffect(() => {
    // This is the existing route that should be deprecated
    replace("/profile/settings");
  }, [replace]);

  return null;
}

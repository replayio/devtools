import { useRouter } from "next/dist/client/router";
import { useEffect } from "react";

import { ExpectedErrorModal } from "ui/components/Errors/ExpectedErrorModal";
import { getAuthHost } from "ui/utils/auth";
import useAuth0 from "ui/utils/useAuth0";

const BrowserError = () => {
  const { logout } = useAuth0();

  let {
    query: { message: content = "Please try again", url, type },
  } = useRouter();

  useEffect(() => {
    if (type === "auth") {
      // Clean up the local auth state separately since we're logging out of
      // auth0 via an iframe
      logout({ localOnly: true });
    }
  }, [logout, type]);

  const handleAction = () => {
    if (url) {
      window.location.href = Array.isArray(url) ? url[0] : url;
    }
  };

  if (content === "Unexpected identity provider") {
    content =
      "We received an unexpected authentication source. Did you mean to use an Enterprise SSO? Please try signing in again from the Replay browser.";
  }

  const authHost = getAuthHost();
  const message = type === "auth" ? "Unable to Sign In" : "Unexpected recording error";

  return (
    <>
      {type === "auth" ? (
        // CORS prevents fetch()-ing the logout URL and logout() wants to
        // redirect so this logs out the user silently so they can restart
        // the auth process cleanly
        <iframe src={`https://${authHost}/v2/logout`} style={{ height: 0, width: 0 }} />
      ) : null}
      <ExpectedErrorModal
        action={url ? "try-again" : undefined}
        details={Array.isArray(content) ? content[0] : content}
        onDismiss={handleAction}
        title={message}
      />
    </>
  );
};

export default BrowserError;

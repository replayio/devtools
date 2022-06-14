import { useRouter } from "next/dist/client/router";
import React from "react";
import { ExpectedErrorScreen } from "ui/components/shared/Error";
import useAuth0 from "ui/utils/useAuth0";

const BrowserError = () => {
  const { logout } = useAuth0();

  let {
    query: { message: content = "Please try again", url, type },
  } = useRouter();

  const handleAction = () => {
    if (url) {
      window.location.href = Array.isArray(url) ? url[0] : url;
    } else if (type === "auth") {
      logout({ returnTo: window.location.origin + "/login" });
    }
  };

  if (content === "Unexpected identity provider") {
    content =
      "We received an unexpected authentication source. Did you mean to use an Enterprise SSO? Try logging out here and signing in again from the Replay browser.";
  }

  const message = type === "auth" ? "Unable to Sign In" : "Unexpected recording error";

  return (
    <ExpectedErrorScreen
      error={{
        message,
        content: Array.isArray(content) ? content[0] : content,
        action: url ? "try-again" : type === "auth" ? "sign-out" : undefined,
        onAction: handleAction,
      }}
    />
  );
};

export default BrowserError;

import { useRouter } from "next/dist/client/router";
import React from "react";
import { ExpectedErrorScreen } from "ui/components/shared/Error";

const BrowserError = () => {
  const {
    query: { message = "Please try again", url },
  } = useRouter();
  const handleAction = () => {
    if (url) {
      window.location.href = Array.isArray(url) ? url[0] : url;
    }
  };

  return (
    <ExpectedErrorScreen
      error={{
        message: "Unexpected recording error",
        content: Array.isArray(message) ? message[0] : message,
        action: url ? "try-again" : undefined,
        onAction: handleAction,
      }}
    />
  );
};

export default BrowserError;

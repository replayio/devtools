import { useRouter } from "next/dist/client/router";
import React from "react";
import { ExpectedErrorScreen } from "ui/components/shared/Error";

const BrowserError = () => {
  const {
    query: { message = "Please try again" },
  } = useRouter();
  return (
    <ExpectedErrorScreen
      error={{
        content: Array.isArray(message) ? message[0] : message,
        message: "Unexpected recording error",
      }}
    />
  );
};

export default BrowserError;

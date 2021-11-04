import React from "react";
import { useLocation } from "react-router";
import { ExpectedErrorScreen } from "ui/components/shared/Error";

const BrowserError = () => {
  const content = new URLSearchParams(useLocation().search).get("message") || "Please try again";
  return <ExpectedErrorScreen error={{ message: "Unexpected recording error", content }} />;
};

export default BrowserError;

import React, { useEffect } from "react";

function getBrowser() {
  if (navigator.vendor === "Google Inc.") {
    return "chrome";
  } else if (navigator.appCodeName === "Mozilla") {
    return "firefox";
  } else {
    return null;
  }
}

export default function Error() {
  const browser = getBrowser();

  return (
    <div className="popup-error">
      <h3>Uh oh</h3>
      <p>Please turn off your pop-up blocker and refresh this page.</p>
    </div>
  );
}

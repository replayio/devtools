import React from "react";

import ReplayLogo from "./shared/ReplayLogo";

export default function MaintenanceModeScreen() {
  return (
    <div className="grid h-full w-full items-center justify-items-center">
      <div className="flex max-w-sm flex-col items-center space-y-8">
        <ReplayLogo size="lg" />
        <h1>Replay is down for maintenance, come back later!</h1>
      </div>
    </div>
  );
}

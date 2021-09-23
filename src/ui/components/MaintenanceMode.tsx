import React from "react";
import { ReplayLogo } from "./shared/Onboarding";

export default function MaintenanceModeScreen() {
  return (
    <div className="grid w-full h-full items-center justify-items-center">
      <div className="flex flex-col space-y-8 max-w-sm items-center">
        <ReplayLogo size="lg" />
        <h1>Replay is down for maintenance, come back later!</h1>
      </div>
    </div>
  );
}

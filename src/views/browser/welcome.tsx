import React from "react";
import { Link } from "react-router-dom";

import WelcomeBanner from "ui/components/WelcomeBanner";

export default function WelcomeToReplay() {
  return (
    <WelcomeBanner
      title="Welcome to"
      subtitle="The new way to record, replay, and debug web applications."
    >
      <Link
        type="button"
        to="./import-settings"
        className="inline-block appearance-none w-42 mt-8 px-8 py-4 border border-transparent text-xl font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Get Started
      </Link>
    </WelcomeBanner>
  );
}

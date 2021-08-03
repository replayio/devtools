import React from "react";
import { Link } from "react-router-dom";

import WelcomeBanner from "ui/components/WelcomeBanner";

function launchMigrationWizard(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  (document.querySelector("#migrationFrame") as HTMLIFrameElement).src = "replay:migrate";
  window.addEventListener("focus", function nav() {
    document.location.href = (e.target as HTMLAnchorElement).href;
    window.removeEventListener("focus", nav);
  });
}

export default function ImportSettings() {
  return (
    <WelcomeBanner
      title="Import Settings to"
      subtitle="Import your cookies, passwords, and bookmarks from another browser to quickly get started with Replay."
    >
      <Link
        type="button"
        to="/"
        className="inline-block appearance-none w-42 mt-8 mx-4 px-8 py-4 border border-transparent text-xl font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={launchMigrationWizard}
      >
        Import
      </Link>
      <Link
        type="button"
        to="/"
        className="inline-block appearance-none w-42 mt-8 mx-4 px-8 py-4 border border-indigo-600 text-xl font-medium rounded-md text-indigo-600 bg-white hover:text-indigo-700 hover:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Skip
      </Link>
      <iframe id="migrationFrame" className="h-0 w-0" />
    </WelcomeBanner>
  );
}

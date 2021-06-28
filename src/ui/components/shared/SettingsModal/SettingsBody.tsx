import React, { useState } from "react";
import { Setting } from "./types";
import { UserSettings } from "ui/types";
import ReplayInvitations from "./ReplayInvitations";
import "./SettingsBody.css";
import SettingsBodyItem from "./SettingsBodyItem";
import { useGetUserInfo } from "ui/hooks/users";
import Spinner from "../Spinner";
import { handleIntercomLogout } from "ui/utils/intercom";
import useAuth0 from "ui/utils/useAuth0";

interface SettingsBodyProps {
  selectedSetting: Setting;
  userSettings: UserSettings;
}

function RefreshPrompt() {
  return (
    <div className="refresh-prompt">
      <span>You need to refresh this page for the changes to take effect.</span>
      <button onClick={() => location.reload()}>Refresh</button>
    </div>
  );
}

function Support() {
  return (
    <li>
      <label className="setting-item">
        <div className="label">Join us on Discord</div>
        <div className="description">
          Come chat with us on our{" "}
          <a href="https://discord.gg/n2dTK6kcRX" target="_blank" rel="noreferrer">
            Discord server.
          </a>
        </div>
        <br />
        <div className="label">Send us an email</div>
        <div className="description">
          You can also send an email at <a href="mailto:support@replay.io">support@replay.io</a>. It
          goes straight to the people making the product, and we'd love to hear your feedback!
        </div>
      </label>
    </li>
  );
}

function Personal() {
  const { logout } = useAuth0();
  const { loading, name, picture, email } = useGetUserInfo();

  if (loading) {
    return <Spinner className="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-500" />;
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-row space-x-4 items-center">
        <img src={picture} className="rounded-full w-16" />
        <div>
          <div className="text-xl">{name}</div>
          <div className="text-xl text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => handleIntercomLogout(logout)}
          className="max-w-max items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default function SettingsBody({ selectedSetting, userSettings }: SettingsBodyProps) {
  const { title, items } = selectedSetting;
  const [showRefresh, setShowRefresh] = useState(false);

  // Special screens that don't change anything in the settings table.
  if (title == "Support") {
    return (
      <main>
        <h1>{title}</h1>
        <ul>
          <Support />
        </ul>
      </main>
    );
  } else if (title == "Invitations") {
    return (
      <main>
        <h1>{title}</h1>
        <ul className="overflow-hidden flex">
          <ReplayInvitations />
        </ul>
      </main>
    );
  } else if (title == "Personal") {
    return (
      <main>
        <h1>{title}</h1>
        <Personal />
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem
            {...{ item, userSettings }}
            key={index}
            setShowRefresh={setShowRefresh}
          />
        ))}
      </ul>
      {showRefresh ? <RefreshPrompt /> : null}
    </main>
  );
}

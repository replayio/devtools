import React, { useState } from "react";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings, SelectedTab } from "./types";

import "./SettingsModal.css";

const settings: Settings = [
  {
    title: "Team",
    items: [
      {
        label: "Share Replays with your team",
        key: "team_sharing",
        description: "Share Replays with others from your domain",
        disabled: false,
      },
    ],
  },
  {
    title: "Experimental",
    items: [
      {
        label: "Enable the Elements pane",
        key: "show_elements",
        description: "The Elements pane allows you to inspect the HTML markup and CSS styling",
        disabled: false,
      },
    ],
  },
  {
    title: "Privacy",
    items: [
      {
        label: "Replays are private by default",
        key: "private_recordings",
        description: null,
        disabled: false,
      },
      {
        label: "Share Replays with others from your domain (replay.io)",
        key: "team_sharing",
        description: null,
        disabled: false,
      },
    ],
  },
  {
    title: "Support",
    items: [],
  },
];

export default function SettingsModal() {
  // No need to handle loading state here as it's already cached from the useGetUserSettings
  // query in the DevTools component
  const { data } = hooks.useGetUserSettings();
  const userSettings = data.user_settings[0];

  const [selectedTab, setSelectedTab] = useState<SelectedTab>(settings[0].title);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  return (
    <div className="settings-modal">
      <Modal>
        <SettingsNavigation {...{ settings, selectedTab, setSelectedTab }} />
        <SettingsBody {...{ selectedSetting, userSettings }} />
      </Modal>
    </div>
  );
}

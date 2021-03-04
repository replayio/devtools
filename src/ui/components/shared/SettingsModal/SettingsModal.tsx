import React, { useState } from "react";
const Modal = require("ui/components/shared/Modal").default;
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
        key: "team-share",
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
        key: "experimental-elements",
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
        key: "appearance-dark-mode",
        description: null,
        disabled: false,
      },
      {
        label: "Share Replays with others from your domain (replay.io)",
        key: "appearance-accent-colors",
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
  const [selectedTab, setSelectedTab] = useState<SelectedTab>(settings[0].title);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  return (
    <div className="settings-modal">
      <Modal>
        <SettingsNavigation {...{ settings, selectedTab, setSelectedTab }} />
        <SettingsBody {...{ selectedSetting }} />
      </Modal>
    </div>
  );
}

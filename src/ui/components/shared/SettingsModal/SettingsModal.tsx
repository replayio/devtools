import React, { useState } from "react";
const Modal = require("ui/components/shared/Modal").default;
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings, SelectedTab } from "./types";

import "./SettingsModal.css";

const settings: Settings = [
  {
    title: "Appearance",
    items: [
      {
        label: "Dark Mode",
        key: "appearance-dark-mode",
        description: "Dark theme is a pretty great feature. Coming soon!",
      },
      {
        label: "Accent Colors",
        key: "appearance-accent-colors",
        description: "We use blue and purple by default, and we’re making this customizable soon.",
      },
    ],
  },
  {
    title: "Team",
    items: [
      {
        label: "Share Replays with your team",
        key: "team-share",
        description: "Share Replays with others from your domain",
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
      },
      {
        label: "Share Replays with others from your domain (replay.io)",
        key: "appearance-accent-colors",
        description: null,
      },
    ],
  },
];

export default function SettingsModal() {
  const [selectedTab, setSelectedTab] = useState<SelectedTab>("Appearance");
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

import React from "react";
import { SettingItem, Setting } from "./types";
import "./SettingsBody.css";

interface SettingsBodyItemProps {
  item: SettingItem;
}

interface SettingsBodyProps {
  selectedSetting: Setting;
}

function SettingsBodyItem({ item }: SettingsBodyItemProps) {
  const { label, key, description } = item;
  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <input type="checkbox" id={key} />
    </li>
  );
}

function Support() {
  return (
    <li>
      <label className="setting-item">
        <div className="label">Join us on Discord</div>
        <div className="description">
          Come chat with us on our{" "}
          <a href="https://discord.gg/Th7AwJsz" target="_blank" rel="noreferrer">
            Discord server
          </a>
          . We’d love to hear your feedback!
        </div>
      </label>
    </li>
  );
}

export default function SettingsBody({ selectedSetting }: SettingsBodyProps) {
  const { title, items } = selectedSetting;

  if (title == "Support") {
    return (
      <main>
        <h1>{title}</h1>
        <Support />
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem {...{ item }} key={index} />
        ))}
      </ul>
    </main>
  );
}

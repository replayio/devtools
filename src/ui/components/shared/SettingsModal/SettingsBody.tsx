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

export default function SettingsBody({ selectedSetting }: SettingsBodyProps) {
  const { title, items } = selectedSetting;

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

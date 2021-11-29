import React, { useState } from "react";
import hooks from "ui/hooks";
import { CheckboxRow } from "./CheckboxRow";
import { CombinedUserSettings } from "ui/types";
import { updateEnableRepaint } from "protocol/enable-repaint";
import { features } from "ui/utils/prefs";

type ExperimentalKey = keyof CombinedUserSettings;
interface ExperimentalSetting {
  label: string;
  description: string;
  key: ExperimentalKey;
}

const EXPERIMENTAL_SETTINGS: ExperimentalSetting[] = [
  {
    label: "React DevTools",
    description: "Inspect the React component tree",
    key: "showReact",
  },
  {
    label: "Global function search",
    description: "Search for functions in all source files",
    key: "enableGlobalSearch",
  },
  {
    label: "Elements pane",
    description: "Inspect HTML markup and CSS styling",
    key: "showElements",
  },
  {
    label: "Repainting",
    description: "Repaint the DOM on demand",
    key: "enableRepaint",
  },
  {
    label: "Network Monitor",
    description: "Inspect network activity",
    key: "enableNetworkMonitor",
  },
];

function Experiment({
  setting,
  onChange,
  checked,
}: {
  setting: ExperimentalSetting;
  checked: boolean;
  onChange: (key: ExperimentalKey, value: any) => void;
}) {
  const { label, key, description } = setting;
  return (
    <CheckboxRow
      id={key}
      onChange={() => onChange(key, !checked)}
      checked={checked}
      label={label}
      description={description}
    />
  );
}

export default function ExperimentalSettings({}) {
  const { userSettings, loading } = hooks.useGetUserSettings();

  // TODO: This is bad and should be updated with a better generalized hook
  const updateRepaint = hooks.useUpdateUserSetting("enableRepaint", "Boolean");
  const updateReact = hooks.useUpdateUserSetting("showReact", "Boolean");
  const updateElements = hooks.useUpdateUserSetting("showElements", "Boolean");
  const updateGlobalSearch = hooks.useUpdateUserSetting("enableGlobalSearch", "Boolean");

  const [enableNetworkMonitor, setEnableNetworkMonitor] = useState(!!features.network);

  const onChange = (key: ExperimentalKey, value: any) => {
    if (key === "enableRepaint") {
      updateRepaint({ variables: { newValue: value } });
      updateEnableRepaint(value);
    } else if (key === "showReact") {
      updateReact({ variables: { newValue: value } });
    } else if (key === "showElements") {
      updateElements({ variables: { newValue: value } });
    } else if (key === "enableGlobalSearch") {
      updateGlobalSearch({ variables: { newValue: value } });
    } else if (key === "enableNetworkMonitor") {
      features.network = value;
      setEnableNetworkMonitor(!!features.network);
    }
  };

  const settings = { ...userSettings, enableNetworkMonitor };

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6 overflow-auto">
      <div className="flex flex-col space-y-2 p-1">
        {EXPERIMENTAL_SETTINGS.map(setting => (
          <Experiment
            onChange={onChange}
            key={setting.key}
            setting={setting}
            checked={!!settings[setting.key]}
          />
        ))}
      </div>
    </div>
  );
}

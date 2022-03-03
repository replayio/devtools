import React, { useState } from "react";
import hooks from "ui/hooks";
import { CheckboxRow } from "./CheckboxRow";
import { CombinedUserSettings } from "ui/types";
import { features } from "ui/utils/prefs";
import { useFeature } from "ui/hooks/settings";

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
    label: "Event Link",
    description: "Jump from an event to a line of code",
    key: "enableEventLink",
  },
  {
    label: "Column Breakpoints",
    description: "Add breakpoints within a line",
    key: "enableColumnBreakpoints",
  },
  {
    label: "Dark Mode",
    description: "Enable Dark mode",
    key: "enableDarkMode",
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
  const updateEventLink = hooks.useUpdateUserSetting("enableEventLink", "Boolean");
  const updateReact = hooks.useUpdateUserSetting("showReact", "Boolean");

  const [enableCommentAttachments, setEnableCommentAttachments] = useState(
    !!features.commentAttachments
  );

  const { value: enableColumnBreakpoints, update: updateEnableColumnBreakpoints } =
    useFeature("columnBreakpoints");
  const { value: enableDarkMode, update: updateEnableDarkMode } = useFeature("darkMode");

  const onChange = (key: ExperimentalKey, value: any) => {
    if (key === "enableEventLink") {
      updateEventLink({ variables: { newValue: value } });
    } else if (key === "enableCommentAttachments") {
      features.commentAttachments = value;
      setEnableCommentAttachments(!!features.commentAttachments);
    } else if (key === "showReact") {
      updateReact({ variables: { newValue: value } });
    } else if (key == "enableColumnBreakpoints") {
      updateEnableColumnBreakpoints(!enableColumnBreakpoints);
    } else if (key == "enableDarkMode") {
      updateEnableDarkMode(!enableDarkMode);
    }
  };

  const localSettings = {
    enableCommentAttachments,
    enableColumnBreakpoints,
    enableDarkMode,
  };
  const settings = { ...userSettings, ...localSettings };

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

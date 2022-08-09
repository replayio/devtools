import React from "react";
import hooks from "ui/hooks";
import { CheckboxRow } from "./CheckboxRow";
import { CombinedExperimentalUserSettings } from "ui/types";
import { useFeature } from "ui/hooks/settings";
import Icon from "ui/components/shared/Icon";

type ExperimentalKey = keyof CombinedExperimentalUserSettings;
interface ExperimentalSetting {
  label: string;
  description: string;
  key: ExperimentalKey;
}

const EXPERIMENTAL_SETTINGS: ExperimentalSetting[] = [
  {
    label: "Column Breakpoints",
    description: "Add breakpoints within a line",
    key: "enableColumnBreakpoints",
  },
  {
    label: "New component architecture",
    description: "Enable the console and inspector UIs",
    key: "enableNewComponentArchitecture",
  },
  {
    label: "Resolve recording",
    description: "Mark a replay as resolved",
    key: "enableResolveRecording",
  },
  {
    label: "Inline hit counts",
    description: "Show line hit counts in the source view",
    key: "hitCounts",
  },
  {
    label: "Profile Source Worker",
    description:
      "Record a performance profile of the source worker and send it to Replay to help diagnose performance issues",
    key: "profileWorkerThreads",
  },
];

const RISKY_EXPERIMENTAL_SETTINGS: ExperimentalSetting[] = [];

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
  const { value: enableColumnBreakpoints, update: updateEnableColumnBreakpoints } =
    useFeature("columnBreakpoints");

  const { value: enableResolveRecording, update: updateEnableResolveRecording } =
    useFeature("resolveRecording");
  const { value: enableNewComponentArchitecture, update: updateEnableNewComponentArchitecture } =
    useFeature("enableNewComponentArchitecture");

  const { value: hitCounts, update: updateHitCounts } = useFeature("hitCounts");
  const { value: profileWorkerThreads, update: updateProfileWorkerThreads } =
    useFeature("profileWorkerThreads");

  const onChange = (key: ExperimentalKey, value: any) => {
    if (key == "enableColumnBreakpoints") {
      updateEnableColumnBreakpoints(!enableColumnBreakpoints);
    } else if (key == "enableResolveRecording") {
      updateEnableResolveRecording(!enableResolveRecording);
    } else if (key === "enableNewComponentArchitecture") {
      updateEnableNewComponentArchitecture(!enableNewComponentArchitecture);
    } else if (key === "hitCounts") {
      updateHitCounts(!hitCounts);
    } else if (key === "profileWorkerThreads") {
      updateProfileWorkerThreads(!profileWorkerThreads);
    }
  };

  const localSettings = {
    enableColumnBreakpoints,
    enableNewComponentArchitecture,
    enableResolveRecording,
    hitCounts,
    profileWorkerThreads,
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
        {RISKY_EXPERIMENTAL_SETTINGS.length > 0 && (
          <div>
            <div className="my-4 flex items-center ">
              <Icon
                filename="warning"
                className="mr-2"
                style={{ backgroundColor: "var(--theme-toolbar-color)" }}
              />
              Increased chance of session errors and performance issues.
            </div>
            {RISKY_EXPERIMENTAL_SETTINGS.map(setting => (
              <Experiment
                onChange={onChange}
                key={setting.key}
                setting={setting}
                checked={!!settings[setting.key]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

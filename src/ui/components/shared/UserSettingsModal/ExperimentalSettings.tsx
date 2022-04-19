import React from "react";
import Icon from "ui/components/shared/Icon";
import hooks from "ui/hooks";
import { useFeature } from "ui/hooks/settings";
import { CombinedExperimentalUserSettings } from "ui/types";

import { CheckboxRow } from "./CheckboxRow";

type ExperimentalKey = keyof CombinedExperimentalUserSettings;
interface ExperimentalSetting {
  label: string;
  description: string;
  key: ExperimentalKey;
}

const EXPERIMENTAL_SETTINGS: ExperimentalSetting[] = [
  {
    description: "Inspect the React component tree",
    key: "showReact",
    label: "React DevTools",
  },
  {
    description: "Jump from an event to a line of code",
    key: "enableEventLink",
    label: "Event Link",
  },
  {
    description: "Add breakpoints within a line",
    key: "enableColumnBreakpoints",
    label: "Column Breakpoints",
  },
  {
    description: "Leave comments on a network request",
    key: "enableNetworkRequestComments",
    label: "Network Request Comments",
  },
  {
    description: "Show autocomplete in the breakpoint panel",
    key: "enableBreakpointPanelAutocomplete",
    label: "Breakpoint Panel Autocomplete",
  },
  {
    description: "Calculate hit counts for editor files all at once",
    key: "codeHeatMaps",
    label: "Code Heatmaps ",
  },
  {
    description: "Mark a replay as resolved",
    key: "enableResolveRecording",
    label: "Resolve recording",
  },
];

const RISKY_EXPERIMENTAL_SETTINGS: ExperimentalSetting[] = [
  {
    description: "Supports replaying longer recordings",
    key: "tenMinuteReplays",
    label: "Ten Minute Replays",
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
  const updateEventLink = hooks.useUpdateUserSetting("enableEventLink");
  const updateReact = hooks.useUpdateUserSetting("showReact");

  const {
    value: enableBreakpointPanelAutocomplete,
    update: updateEnableBreakpointPanelAutocomplete,
  } = useFeature("breakpointPanelAutocomplete");
  const { value: enableColumnBreakpoints, update: updateEnableColumnBreakpoints } =
    useFeature("columnBreakpoints");
  const { value: enableNetworkRequestComments, update: updateEnableNetworkRequestComments } =
    useFeature("networkRequestComments");
  const { value: enableTenMinuteReplays, update: updateEnableTenMinuteReplays } =
    useFeature("tenMinuteReplays");
  const { value: enableAdvancedTimeline, update: updateEnableAdvancedTimeline } =
    useFeature("advancedTimeline");

  const { value: codeHeatMaps, update: updateCodeHeatMaps } = useFeature("codeHeatMaps");
  const { value: enableResolveRecording, update: updateEnableResolveRecording } =
    useFeature("resolveRecording");

  const onChange = (key: ExperimentalKey, value: any) => {
    if (key === "enableEventLink") {
      updateEventLink({ variables: { newValue: value } });
    } else if (key === "showReact") {
      updateReact({ variables: { newValue: value } });
    } else if (key === "enableBreakpointPanelAutocomplete") {
      updateEnableBreakpointPanelAutocomplete(!enableBreakpointPanelAutocomplete);
    } else if (key == "enableColumnBreakpoints") {
      updateEnableColumnBreakpoints(!enableColumnBreakpoints);
    } else if (key == "enableNetworkRequestComments") {
      updateEnableNetworkRequestComments(!enableNetworkRequestComments);
    } else if (key == "tenMinuteReplays") {
      updateEnableTenMinuteReplays(!enableTenMinuteReplays);
    } else if (key == "codeHeatMaps") {
      updateCodeHeatMaps(!codeHeatMaps);
    } else if (key == "enableResolveRecording") {
      updateEnableResolveRecording(!enableResolveRecording);
    }
  };

  const localSettings = {
    codeHeatMaps,
    enableBreakpointPanelAutocomplete,
    enableColumnBreakpoints,
    enableNetworkRequestComments,
    enableResolveRecording,
    tenMinuteReplays: enableTenMinuteReplays,
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
        <div>
          <div className="my-4  flex items-center ">
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
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import hooks from "ui/hooks";
import { CheckboxRow } from "./CheckboxRow";
import { CombinedExperimentalUserSettings } from "ui/types";
import { useFeature } from "ui/hooks/settings";

type ExperimentalKey = keyof CombinedExperimentalUserSettings;
interface ExperimentalSetting {
  label: string;
  description: string;
  key: ExperimentalKey;
  secret?: boolean;
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
    label: "Network Request Comments",
    description: "Leave comments on a network request",
    key: "enableNetworkRequestComments",
  },
  {
    label: "Breakpoint Panel Autocomplete",
    description: "Show autocomplete in the breakpoint panel",
    key: "enableBreakpointPanelAutocomplete",
  },
  {
    label: "Multiple Controllers",
    description: "Runs the replay across many machines",
    key: "useMultipleControllers",
    secret: true,
  },
  {
    label: "Replay Snapshots",
    description: "Use snapshots to restore from a prior replay",
    key: "multipleControllerUseSnapshots",
    secret: true,
  },
  {
    label: "Code Heatmaps ",
    description: "Calculate hit counts for editor files all at once",
    key: "codeHeatMaps",
  },
  {
    label: "Resolve recording",
    description: "Mark a recording as resolved",
    key: "enableResolveRecording",
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

function useGetShowSecretSettings() {
  const [showSecretSettings, setShowSecretSettings] = useState(false);
  const [shiftCount, setShiftCount] = useState(0);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  function onKeyDown(e: KeyboardEvent) {
    if (showSecretSettings) {
      return;
    }

    if (e.key !== "Shift") {
      return setShiftCount(0);
    }

    if (shiftCount == 9) {
      return setShowSecretSettings(true);
    }

    setShiftCount(shiftCount + 1);
  }

  return showSecretSettings;
}

export default function ExperimentalSettings({}) {
  const { userSettings, loading } = hooks.useGetUserSettings();
  const showSecretSettings = useGetShowSecretSettings();

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
  const { value: enableUseMultipleControllers, update: updateEnableUseMultipleControllers } =
    useFeature("useMultipleControllers");
  const {
    value: enableMultipleControllerUseSnapshots,
    update: updateEnableMultipleControllerUseSnapshots,
  } = useFeature("multipleControllerUseSnapshots");
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
    } else if (key == "useMultipleControllers") {
      updateEnableUseMultipleControllers(!enableUseMultipleControllers);
    } else if (key == "multipleControllerUseSnapshots") {
      updateEnableMultipleControllerUseSnapshots(!enableMultipleControllerUseSnapshots);
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
    useMultipleControllers: enableUseMultipleControllers,
    multipleControllerUseSnapshots: enableMultipleControllerUseSnapshots,
    enableResolveRecording,
  };

  const settings = { ...userSettings, ...localSettings };

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6 overflow-auto">
      <div className="flex flex-col space-y-2 p-1">
        {EXPERIMENTAL_SETTINGS.map(
          setting =>
            (!setting.secret || showSecretSettings) && (
              <Experiment
                onChange={onChange}
                key={setting.key}
                setting={setting}
                checked={!!settings[setting.key]}
              />
            )
        )}
      </div>
    </div>
  );
}

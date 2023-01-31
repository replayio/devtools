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
    label: "Column Breakpoints",
    description: "Add breakpoints within a line",
    key: "enableColumnBreakpoints",
  },
  {
    label: "Profile Source Worker",
    description:
      "Record a performance profile of the source worker and send it to Replay to help diagnose performance issues",
    key: "profileWorkerThreads",
  },
  {
    label: "Enable query-level caching for unstable request types",
    description:
      "Allow the backend to return previously generated responses without re-running the request",
    key: "enableUnstableQueryCache",
  },
  {
    label: "Disable query-level caching for stable request types",
    description: "Disable caching of previously generated responses",
    key: "disableStableQueryCache",
  },
  {
    label: "Detailed loading bar",
    description:
      "Split the loading bar's progress between gathering static resources from the recording and indexing runtime information",
    key: "basicProcessingLoadingBar",
  },
  {
    label: "Console filter drawer defaults to open",
    description:
      "Open the console filter settings by default when opening a Replay for the first time",
    key: "consoleFilterDrawerDefaultsToOpen",
  },
  {
    label: "Disable scan data cache",
    description: "Do not cache the results of indexing the recording",
    key: "disableScanDataCache",
  },
  {
    label: "Enable workaround for broken sourcemaps",
    description: "Skip locations that are mapped to the beginning of a function body",
    key: "brokenSourcemapWorkaround",
  },
  {
    label: "Enable backend processing routines",
    description: "Enable backend support for running processing routines (like React DevTools)",
    key: "enableRoutines",
  },
  {
    label: "Retry backend processing routines",
    description: "Always re-run routines instead of using cached results",
    key: "rerunRoutines",
  },
  {
    label: "Track recording assets in the database",
    description:
      "Enable writing to and reading from the backend database when storing or retrieving recording assets",
    key: "trackRecordingAssetsInDatabase",
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
  const { value: disableScanDataCache, update: updateDisableScanDataCache } =
    useFeature("disableScanDataCache");

  const {
    value: consoleFilterDrawerDefaultsToOpen,
    update: updateConsoleFilterDrawerDefaultsToOpen,
  } = useFeature("consoleFilterDrawerDefaultsToOpen");
  const { value: profileWorkerThreads, update: updateProfileWorkerThreads } =
    useFeature("profileWorkerThreads");
  const { value: enableUnstableQueryCache, update: updateEnableUnstableQueryCache } = useFeature(
    "enableUnstableQueryCache"
  );
  const { value: disableStableQueryCache, update: updateDisableStableQueryCache } =
    useFeature("disableStableQueryCache");
  const { value: basicProcessingLoadingBar, update: updateBasicProcessingLoadingBar } = useFeature(
    "basicProcessingLoadingBar"
  );
  const { value: brokenSourcemapWorkaround, update: updateBrokenSourcemapWorkaround } = useFeature(
    "brokenSourcemapWorkaround"
  );

  const { value: enableRoutines, update: updateEnableRoutines } = useFeature("enableRoutines");
  const { value: rerunRoutines, update: updatererunRoutines } = useFeature("rerunRoutines");

  const { value: trackRecordingAssetsInDatabase, update: updateTrackRecordingAssetsInDatabase } =
    useFeature("trackRecordingAssetsInDatabase");

  const onChange = (key: ExperimentalKey, value: any) => {
    if (key == "enableColumnBreakpoints") {
      updateEnableColumnBreakpoints(!enableColumnBreakpoints);
    } else if (key === "profileWorkerThreads") {
      updateProfileWorkerThreads(!profileWorkerThreads);
    } else if (key === "enableUnstableQueryCache") {
      updateEnableUnstableQueryCache(!enableUnstableQueryCache);
    } else if (key === "disableStableQueryCache") {
      updateDisableStableQueryCache(!disableStableQueryCache);
    } else if (key === "basicProcessingLoadingBar") {
      updateBasicProcessingLoadingBar(!basicProcessingLoadingBar);
    } else if (key === "consoleFilterDrawerDefaultsToOpen") {
      updateConsoleFilterDrawerDefaultsToOpen(!consoleFilterDrawerDefaultsToOpen);
    } else if (key === "disableScanDataCache") {
      updateDisableScanDataCache(!disableScanDataCache);
    } else if (key === "brokenSourcemapWorkaround") {
      updateBrokenSourcemapWorkaround(!brokenSourcemapWorkaround);
    } else if (key === "enableRoutines") {
      updateEnableRoutines(!enableRoutines);
    } else if (key === "rerunRoutines") {
      updatererunRoutines(!rerunRoutines);
    } else if (key === "trackRecordingAssetsInDatabase") {
      updateTrackRecordingAssetsInDatabase(!trackRecordingAssetsInDatabase);
    }
  };

  const localSettings = {
    basicProcessingLoadingBar,
    brokenSourcemapWorkaround,
    consoleFilterDrawerDefaultsToOpen,
    disableScanDataCache,
    disableStableQueryCache,
    enableColumnBreakpoints,
    enableUnstableQueryCache,
    enableRoutines,
    rerunRoutines,
    profileWorkerThreads,
    trackRecordingAssetsInDatabase,
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

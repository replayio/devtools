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
    label: "React DevTools",
    description: "Inspect the React component tree",
    key: "showReact",
  },
  {
    label: "Redux DevTools",
    description: "Inspect the Redux actions history",
    key: "showRedux",
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
    label: "Large Text",
    description: "Enable large text for Editor",
    key: "enableLargeText",
  },
  {
    label: "Resolve recording",
    description: "Mark a replay as resolved",
    key: "enableResolveRecording",
  },
  {
    description: "Add prefixes to print statements",
    key: "unicornConsole",
    label: "Unicorn console",
  },
  {
    label: "Turbo Replay",
    description: "Replay recordings across multiple instances",
    key: "turboReplay",
  },
  {
    label: "Inline hit counts",
    description: "Show line hit counts in the source view",
    key: "hitCounts",
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
  const { value: enableTurboReplay, update: updateEnableTurboReplay } = useFeature("turboReplay");
  const { value: enableUnicornConsole, update: updateEnableUnicornConsole } =
    useFeature("unicornConsole");
  const { value: enableReduxDevtools, update: updateEnableReduxDevtools } = useFeature("showRedux");

  const { value: enableResolveRecording, update: updateEnableResolveRecording } =
    useFeature("resolveRecording");
  const { value: enableLargeText, update: updateEnableLargeText } = useFeature("enableLargeText");
  const { value: hitCounts, update: updateHitCounts } = useFeature("hitCounts");

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
    } else if (key == "turboReplay") {
      updateEnableTurboReplay(!enableTurboReplay);
    } else if (key == "enableResolveRecording") {
      updateEnableResolveRecording(!enableResolveRecording);
    } else if (key == "unicornConsole") {
      updateEnableUnicornConsole(!enableUnicornConsole);
    } else if (key === "showRedux") {
      updateEnableReduxDevtools(!enableReduxDevtools);
    } else if (key === "enableLargeText") {
      updateEnableLargeText(!enableLargeText);
    } else if (key === "hitCounts") {
      updateHitCounts(!enableLargeText);
    }
  };

  const localSettings = {
    enableBreakpointPanelAutocomplete,
    enableColumnBreakpoints,
    enableNetworkRequestComments,
    enableResolveRecording,
    hitCounts,
    turboReplay: enableTurboReplay,
    unicornConsole: enableUnicornConsole,
    showRedux: enableReduxDevtools,
    enableLargeText,
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
        )}
      </div>
    </div>
  );
}

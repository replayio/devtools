import React from "react";
import { connect, ConnectedProps } from "react-redux";

import { updateEnableRepaint } from "protocol/enable-repaint";
import { handleIntercomLogout } from "ui/utils/intercom";
import useAuth0 from "ui/utils/useAuth0";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { SettingsTabTitle } from "ui/state/app";
import { ApiKey, UserSettings } from "ui/types";

import APIKeys from "../APIKeys";
import SettingsModal from "../SettingsModal";
import { Settings } from "../SettingsModal/types";
import { SettingsBodyHeader } from "../SettingsModal/SettingsBody";

import { getFeatureFlag } from "ui/utils/launchdarkly";
import { AvatarImage } from "ui/components/Avatar";
import PreferencesSettings from "./PreferencesSettings";
import ExternalLink from "../ExternalLink";

function Support() {
  return (
    <ul>
      <li className="flex flex-row items-center">
        <label className="space-y-1.5 pr-36 flex-grow">
          <SettingsBodyHeader>Join us on Discord</SettingsBodyHeader>
          <div className="description">
            Come chat with us on our{" "}
            <ExternalLink href="https://discord.gg/n2dTK6kcRX">Discord server.</ExternalLink>
          </div>
        </label>
      </li>
      <li className="flex flex-row items-center">
        <label className="space-y-1.5 pr-36 flex-grow">
          <SettingsBodyHeader>Send us an email</SettingsBodyHeader>
          <div className="description">
            You can also send an email at <a href="mailto:support@replay.io">support@replay.io</a>.
            It goes straight to the people making the product, and we&apos;d love to hear your
            feedback!
          </div>
        </label>
      </li>
    </ul>
  );
}

function Personal() {
  const { logout, user } = useAuth0();
  const { name, picture, email } = user!;

  return (
    <div className="space-y-12">
      <div className="flex flex-row space-x-3 items-center" data-private>
        <AvatarImage src={picture} className="rounded-full w-12 avatar" />
        <div>
          <div className="text-base">{name}</div>
          <div className="text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => handleIntercomLogout(logout)}
          className="max-w-max items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

function Legal() {
  return (
    <div className="space-y-12 pr-36">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <SettingsBodyHeader>
            <ExternalLink className="underline" href="https://www.replay.io/terms-of-use">
              Terms of Use
            </ExternalLink>
          </SettingsBodyHeader>
          <div>{`The Terms of Use help define Replay's relationship with you as you interact with our services.`}</div>
        </div>
        <div className="space-y-1.5">
          <SettingsBodyHeader>
            <ExternalLink className="underline" href="https://www.replay.io/privacy-policy">
              Privacy Policy
            </ExternalLink>
          </SettingsBodyHeader>
          <div>{`Our Privacy Policy outlines how you can update, manage, and delete your information.`}</div>
        </div>
      </div>
    </div>
  );
}

function UserAPIKeys({ apiKeys }: { apiKeys: ApiKey[] }) {
  const { addUserApiKey, loading: addLoading, error: addError } = hooks.useAddUserApiKey();
  const { deleteUserApiKey } = hooks.useDeleteUserApiKey();

  return (
    <APIKeys
      apiKeys={apiKeys}
      description="API Keys allow you to upload recordings programmatically from your automated tests or from your continuous integration environment."
      loading={addLoading}
      error={addError}
      addKey={(label, scopes) =>
        addUserApiKey({ variables: { label: label, scopes } }).then(
          resp => resp.data.createUserAPIKey
        )
      }
      deleteKey={id => deleteUserApiKey({ variables: { id } })}
      scopes={["admin:all"]}
    />
  );
}

function ApiKeysWrapper({ settings }: { settings?: UserSettings }) {
  if (!settings) return null;

  return <UserAPIKeys apiKeys={settings.apiKeys} />;
}

const getSettings = (internal: boolean): Settings<SettingsTabTitle, UserSettings, {}> => [
  {
    title: "Personal",
    icon: "person",
    component: Personal,
  },
  {
    title: "API Keys",
    icon: "vpn_key",
    component: ApiKeysWrapper,
  },
  {
    title: "Preferences",
    icon: "tune",
    component: PreferencesSettings,
  },
  {
    title: "Experimental",
    icon: "biotech",
    items: [
      {
        label: "Enable React DevTools",
        type: "checkbox",
        key: "showReact",
        description: "Inspect the React component tree",
        disabled: false,
      },
      {
        label: "Enable global function search",
        type: "checkbox",
        key: "enableGlobalSearch",
        description: "Search for functions in all source files",
        disabled: false,
      },
      {
        label: "Enable the Elements pane",
        type: "checkbox",
        key: "showElements",
        description: "Inspect HTML markup and CSS styling",
        disabled: false,
        comingSoon: !internal,
      },
      {
        label: "Enable repainting",
        type: "checkbox",
        key: "enableRepaint",
        description: "Repaint the DOM on demand",
        disabled: false,
        comingSoon: !internal,
      },
    ],
  },
  {
    title: "Support",
    icon: "support",
    component: Support,
  },
  {
    title: "Legal",
    icon: "gavel",
    component: Legal,
  },
];

export function UserSettingsModal(props: PropsFromRedux) {
  const { userSettings, loading } = hooks.useGetUserSettings();
  const { internal, loading: userInfoLoading } = hooks.useGetUserInfo();
  const view = props.view === "preferences" ? "Preferences" : props.defaultSettingsTab;

  // TODO: This is bad and should be updated with a better generalized hook
  const updateRepaint = hooks.useUpdateUserSetting("enableRepaint", "Boolean");
  const updateReact = hooks.useUpdateUserSetting("showReact", "Boolean");
  const updateElements = hooks.useUpdateUserSetting("showElements", "Boolean");
  const updateGlobalSearch = hooks.useUpdateUserSetting("enableGlobalSearch", "Boolean");

  const onChange = (key: keyof UserSettings, value: any) => {
    if (key === "enableRepaint") {
      updateRepaint({ variables: { newValue: value } });
      updateEnableRepaint(value);
    } else if (key === "showReact") {
      updateReact({ variables: { newValue: value } });
    } else if (key === "showElements") {
      updateElements({ variables: { newValue: value } });
    } else if (key === "enableGlobalSearch") {
      updateGlobalSearch({ variables: { newValue: value } });
    }
  };

  const hiddenTabs = getFeatureFlag("new-user-invitations", true) ? undefined : ["Invitations"];

  const settings = getSettings(internal);
  return (
    <SettingsModal
      hiddenTabs={hiddenTabs}
      tab={view}
      loading={loading || userInfoLoading}
      onChange={onChange}
      panelProps={{}}
      settings={settings}
      values={userSettings}
    />
  );
}

const connector = connect(
  (state: UIState) => {
    const opts = selectors.getModalOptions(state);
    const view = opts && "view" in opts ? opts.view : null;
    return {
      defaultSettingsTab: selectors.getDefaultSettingsTab(state),
      view,
    };
  },
  { setDefaultSettingsTab: actions.setDefaultSettingsTab }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(UserSettingsModal);

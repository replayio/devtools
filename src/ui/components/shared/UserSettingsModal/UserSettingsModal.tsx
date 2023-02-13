import React from "react";
import { ConnectedProps, connect } from "react-redux";

import * as actions from "ui/actions/app";
import { AvatarImage } from "ui/components/Avatar";
import hooks from "ui/hooks";
import { useBoolPref, useFeature } from "ui/hooks/settings";
import { UserInfo, useGetUserInfo } from "ui/hooks/users";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { SettingsTabTitle } from "ui/state/app";
import useAuth0 from "ui/utils/useAuth0";

import APIKeys from "../APIKeys";
import ExternalLink from "../ExternalLink";
import SettingsModal from "../SettingsModal";
import { SettingsBodyHeader } from "../SettingsModal/SettingsBody";
import { Settings } from "../SettingsModal/types";
import { CheckboxRow } from "./CheckboxRow";
import ExperimentalSettings from "./ExperimentalSettings";
import PreferencesSettings from "./PreferencesSettings";

function Support() {
  return (
    <ul>
      <li className="flex flex-row items-center">
        <label className="flex-grow space-y-1.5 pr-36">
          <SettingsBodyHeader>Join us on Discord</SettingsBodyHeader>
          <div className="description">
            Come chat with us on our{" "}
            <ExternalLink href="https://discord.gg/n2dTK6kcRX">Discord server.</ExternalLink>
          </div>
        </label>
      </li>
      <li className="flex flex-row items-center">
        <label className="flex-grow space-y-1.5 pr-36">
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
  const { logout } = useAuth0();
  const { name, email, picture } = useGetUserInfo();

  return (
    <div className="space-y-12">
      <div className="flex flex-row items-center space-x-3" data-private>
        <AvatarImage src={picture} className="avatar w-12 rounded-full" />
        <div>
          <div className="text-base">{name}</div>
          <div className="text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => logout({ returnTo: window.location.origin + "/login" })}
          className="max-w-max items-center rounded-md border border-transparent bg-primaryAccent px-3 py-1.5 font-medium text-white shadow-sm hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
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

function UserAPIKeys() {
  const { userSettings, loading } = hooks.useGetUserSettings();
  const { addUserApiKey, loading: addLoading, error: addError } = hooks.useAddUserApiKey();
  const { deleteUserApiKey } = hooks.useDeleteUserApiKey();

  if (loading) {
    return null;
  }

  return (
    <APIKeys
      apiKeys={userSettings.apiKeys}
      description="API Keys allow you to upload recordings programmatically from your automated tests or from your continuous integration environment."
      loading={addLoading}
      error={addError}
      addKey={(label, scopes) =>
        // @ts-ignore
        addUserApiKey({ variables: { label: label, scopes } }).then(
          resp => resp.data?.createUserAPIKey
        )
      }
      deleteKey={id => deleteUserApiKey({ variables: { id } })}
      scopes={["admin:all"]}
    />
  );
}

function Advanced() {
  const { value: logTelemetryEvent, update: updateLogTelemetryEvent } =
    useBoolPref("logTelemetryEvent");
  const { value: protocolTimeline, update: updateProtocolTimeline } =
    useFeature("protocolTimeline");
  const { value: chromiumRepaints, update: updateChromiumRepaints } =
    useFeature("chromiumRepaints");
  const { value: logProtocol, update: updateLogProtocol } = useFeature("logProtocol");
  const { value: newControllerOnRefresh, update: updateNewControllerOnRefresh } =
    useFeature("newControllerOnRefresh");

  return (
    <div>
      <div className="mb-4">
        <CheckboxRow
          id={"mixpanel"}
          onChange={() => updateLogTelemetryEvent(!logTelemetryEvent)}
          checked={logTelemetryEvent}
          label={"Log Mixpanel events to the console"}
          description={""}
        />
      </div>
      <div className="mb-4">
        <CheckboxRow
          id={"protocol-timeline"}
          onChange={() => updateProtocolTimeline(!protocolTimeline)}
          checked={protocolTimeline}
          label={"Visualize protocol events in the timeline"}
          description={""}
        />
      </div>
      <div className="mb-4">
        <CheckboxRow
          id={"protocol-viewer"}
          onChange={() => updateLogProtocol(!logProtocol)}
          checked={logProtocol}
          label={"View protocol requests and responses in the panel"}
          description={""}
        />
      </div>
      <div className="mb-4">
        <CheckboxRow
          id={"new-controller-on-refresh"}
          onChange={() => updateNewControllerOnRefresh(!newControllerOnRefresh)}
          checked={newControllerOnRefresh}
          label={"Get a new controller upon each page refresh"}
          description={""}
        />
      </div>
      <div className="mb-4">
        <CheckboxRow
          id={"chromium-repaints"}
          onChange={() => updateChromiumRepaints(!chromiumRepaints)}
          checked={chromiumRepaints}
          label={"Allow DOM.repaintGraphics inside of Chromium recordings"}
          description={""}
        />
      </div>
    </div>
  );
}

const getSettings = (user: UserInfo): Settings<SettingsTabTitle, {}> => [
  {
    title: "Personal",
    icon: "person",
    component: Personal,
  },
  {
    title: "Preferences",
    icon: "tune",
    component: PreferencesSettings,
  },
  {
    title: "API Keys",
    icon: "vpn_key",
    component: UserAPIKeys,
  },

  {
    title: "Experimental",
    icon: "biotech",
    component: ExperimentalSettings,
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
  {
    title: "Advanced",
    icon: "api",
    component: Advanced,
  },
];

export function UserSettingsModal(props: PropsFromRedux) {
  const user = hooks.useGetUserInfo();
  const view = props.view === "preferences" ? "Preferences" : props.defaultSettingsTab;
  const hiddenTabs = [];

  if (user) {
    if (!user.features.library) {
      hiddenTabs.push("API Keys");
    }

    if (!user.internal) {
      hiddenTabs.push("Advanced");
    }
  }

  return (
    <SettingsModal
      hiddenTabs={hiddenTabs}
      tab={view}
      panelProps={{}}
      settings={getSettings(user)}
      loading={user.loading}
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

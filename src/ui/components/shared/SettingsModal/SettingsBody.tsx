import React, { useEffect, useMemo, useState } from "react";
import { Setting } from "./types";
import { ApiKey, UserSettings } from "ui/types";
import ReplayInvitations from "./ReplayInvitations";
import "./SettingsBody.css";
import SettingsBodyItem from "./SettingsBodyItem";
import { handleIntercomLogout } from "ui/utils/intercom";
import useAuth0 from "ui/utils/useAuth0";
import hooks from "ui/hooks";
import TextInput from "../Forms/TextInput";
import MaterialIcon from "../MaterialIcon";
import APIKeys from "../APIKeys";

interface SettingsBodyProps {
  selectedSetting: Setting;
  userSettings: UserSettings;
}

function RefreshPrompt() {
  return (
    <div className="refresh-prompt">
      <span>You need to refresh this page for the changes to take effect.</span>
      <button onClick={() => location.reload()}>Refresh</button>
    </div>
  );
}

function Support() {
  return (
    <>
      <li className="flex flex-row items-center">
        <label className="space-y-2 pr-48 flex-grow">
          <SettingsBodyHeader>Join us on Discord</SettingsBodyHeader>
          <div className="description">
            Come chat with us on our{" "}
            <a href="https://discord.gg/n2dTK6kcRX" target="_blank" rel="noreferrer">
              Discord server.
            </a>
          </div>
        </label>
      </li>
      <li className="flex flex-row items-center">
        <label className="space-y-2 pr-48 flex-grow">
          <SettingsBodyHeader>Send us an email</SettingsBodyHeader>
          <div className="description">
            You can also send an email at <a href="mailto:support@replay.io">support@replay.io</a>.
            It goes straight to the people making the product, and we'd love to hear your feedback!
          </div>
        </label>
      </li>
    </>
  );
}

function Personal() {
  const { logout, user } = useAuth0();
  const { name, picture, email } = user;

  return (
    <div className="space-y-16">
      <div className="flex flex-row space-x-4 items-center">
        <img src={picture} className="rounded-full w-16" />
        <div>
          <div className="text-xl">{name}</div>
          <div className="text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => handleIntercomLogout(logout)}
          className="max-w-max items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

function Legal() {
  return (
    <div className="space-y-16 pr-48">
      <div className="space-y-4">
        <div className="space-y-2">
          <SettingsBodyHeader>
            <a
              className="underline"
              href="https://replay.io/tos.html"
              target="_blank"
              rel="noreferrer"
            >
              Terms of Use
            </a>
          </SettingsBodyHeader>
          <div>{`The Terms of Use help define Replay's relationship with you as you interact with our services.`}</div>
        </div>
        <div className="space-y-2">
          <SettingsBodyHeader>
            <a
              className="underline"
              href="https://replay.io/privacy.html"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
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

function SettingsBodyWrapper({ children }: { children: (React.ReactChild | null)[] }) {
  return <main className="text-lg">{children}</main>;
}

export function SettingsHeader({ children }: { children: React.ReactChild }) {
  return <h1 className="text-3xl">{children}</h1>;
}

export function SettingsBodyHeader({ children }: { children: React.ReactChild }) {
  return <h2 className="text-2xl">{children}</h2>;
}

export default function SettingsBody({ selectedSetting, userSettings }: SettingsBodyProps) {
  const { title, items } = selectedSetting;
  const [showRefresh, setShowRefresh] = useState(false);

  // Special screens that don't change anything in the settings table.
  if (title == "Support") {
    return (
      <SettingsBodyWrapper>
        <SettingsHeader>{title}</SettingsHeader>
        <ul>
          <Support />
        </ul>
      </SettingsBodyWrapper>
    );
  } else if (title == "Invitations") {
    return (
      <SettingsBodyWrapper>
        <SettingsHeader>{title}</SettingsHeader>
        <ul className="overflow-hidden flex">
          <ReplayInvitations />
        </ul>
      </SettingsBodyWrapper>
    );
  } else if (title == "Personal") {
    return (
      <SettingsBodyWrapper>
        <SettingsHeader>{title}</SettingsHeader>
        <Personal />
      </SettingsBodyWrapper>
    );
  } else if (title == "Legal") {
    return (
      <SettingsBodyWrapper>
        <SettingsHeader>{title}</SettingsHeader>
        <Legal />
      </SettingsBodyWrapper>
    );
  } else if (title == "API Keys") {
    return (
      <SettingsBodyWrapper>
        <SettingsHeader>{title}</SettingsHeader>
        <UserAPIKeys apiKeys={userSettings.apiKeys} />
      </SettingsBodyWrapper>
    );
  }

  return (
    <SettingsBodyWrapper>
      <SettingsHeader>{title}</SettingsHeader>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem
            {...{ item, userSettings }}
            key={index}
            setShowRefresh={setShowRefresh}
          />
        ))}
      </ul>
      {showRefresh ? <RefreshPrompt /> : null}
    </SettingsBodyWrapper>
  );
}

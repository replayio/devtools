/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
import { connect } from "../utils/connect";
import actions from "../actions";
import { useGetUserSettings } from "ui/hooks/settings";
import { setSelectedPrimaryPanel } from "ui/actions/app";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { ConnectedProps } from "react-redux";

type Action = {
  enabled: boolean;
  icon: string;
  label: string;
  onClick: () => void;
};
function LaunchButton({ action }: { action: Action }) {
  if (!action.enabled) {
    return null;
  }
  return (
    <div
      className="mx-4 w-32 h-32 py-2 flex flex-col justify-around items-center blur rounded-md"
      style={{ background: "rgba(255,255,255,0.6)" }}
      role="button"
      tabIndex={0}
      onClick={action.onClick}
    >
      <div
        className="w-16 h-16 flex items-center justify-center bg-primaryAccent color-white"
        style={{ borderRadius: "80px" }}
      >
        <MaterialIcon className="text-white transform" iconSize="4xl">
          {action.icon}
        </MaterialIcon>
      </div>
      <span style={{ color: "#3487FF" }} className="text-md font-semibold text-center">
        {action.label}
      </span>
    </div>
  );
}

function WelcomeBox({ openQuickOpen, setSelectedPrimaryPanel }: PropsFromRedux) {
  const { userSettings, loading } = useGetUserSettings();
  if (loading) {
    return null;
  }

  const actions = [
    { label: "Open file", enabled: true, icon: "description", onClick: () => openQuickOpen() },
    {
      label: "Search functions",
      enabled: userSettings.enableGlobalSearch,
      icon: "alternate_email",
      onClick: () => openQuickOpen("@", true),
    },
    {
      label: "Search text",
      enabled: true,
      icon: "search",
      onClick: () => setSelectedPrimaryPanel("search"),
    },
  ];

  return (
    <div className="welcomebox relative flex flex-col items-center h-full w-full ">
      <div className="launcher justify-center z-10 flex mt-14 px-8 w-full ">
        {actions.map(action => (
          <LaunchButton action={action} />
        ))}
      </div>
      <div className="absolute z-0">
        <img src="/images/bubble.svg" className=" " style={{ transform: "scale(2.4)" }} />
      </div>
    </div>
  );
}

const connector = connect(() => ({}), {
  openQuickOpen: actions.openQuickOpen,
  setSelectedPrimaryPanel,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(WelcomeBox);

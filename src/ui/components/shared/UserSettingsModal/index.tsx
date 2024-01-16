import { Support } from "ui/components/shared/UserSettingsModal/panels/Support";
import { useGetUserInfo } from "ui/hooks/users";
import { getDefaultSettingsTab, getModalOptions } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { SettingsTabTitle } from "ui/state/app";
import useAuth0 from "ui/utils/useAuth0";

import SettingsModal from "../SettingsModal";
import { Settings } from "../SettingsModal/types";
import { Advanced } from "./panels/Advanced";
import { ApiKeys } from "./panels/ApiKeys";
import { Legal } from "./panels/Legal";
import { Personal } from "./panels/Personal";
import { Preferences } from "./panels/Preferences";
import { Advanced as AdvancedTitle } from "./titles/Advanced";

const PANELS: Settings<SettingsTabTitle, {}> = [
  {
    title: "Personal",
    icon: "person",
    component: Personal,
  },
  {
    title: "Preferences",
    icon: "tune",
    component: Preferences,
  },
  {
    title: "API Keys",
    icon: "vpn_key",
    component: ApiKeys,
  },

  // PR #9997 removed the last experimental setting
  // Until we have another one, we should hide that tab
  // {
  //   title: "Experimental",
  //   icon: "biotech",
  //   component: Experimental,
  // },
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
    titleComponent: AdvancedTitle,
    icon: "api",
    component: Advanced,
  },
];

export default function UserSettingsModal() {
  const options = useAppSelector(getModalOptions);
  const defaultSettingsTab = useAppSelector(getDefaultSettingsTab);

  const { loading, features } = useGetUserInfo();
  const { isAuthenticated } = useAuth0();

  const hiddenTabs = [];
  if (!isAuthenticated) {
    hiddenTabs.push("Personal");
  }
  if (!features.library) {
    hiddenTabs.push("API Keys");
  }

  const view = options?.view === "preferences" ? "Preferences" : defaultSettingsTab;

  return <SettingsModal hiddenTabs={hiddenTabs} tab={view} settings={PANELS} loading={loading} />;
}

import { useRouter } from "next/router";

import { SettingsHandler } from "./SettingsHandler";

export function ParamHandler() {
  const { settings } = useRouter().query;
  return <>{settings ? <SettingsHandler /> : null}</>;
}

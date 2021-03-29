import { SettingItemKey } from "ui/components/shared/SettingsModal/types";
import { useAuth0 } from "@auth0/auth0-react";
import { databaseQuery, invalidateDatabaseQueries } from "protocol/database";
import { sendMessage } from "protocol/socket";

const anonymousSettings = {
  show_elements: false,
  show_react: false,
};

export function useGetUserSettings() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return { userSettings: anonymousSettings, loading: false };
  }

  const { data, error, loading } = databaseQuery("getUserSettings", {});

  if (loading) {
    return { data, error, loading };
  }

  if (error) {
    console.error("Apollo error while getting user settings:", error);
    return { data, error, loading };
  }

  return { userSettings: data.settings, error, loading };
}

export function useUpdateUserSetting(key: SettingItemKey) {
  return async (newValue: boolean) => {
    // Using sendMessage to avoid having to update TS definitions.
    await sendMessage("Database.updateUserSetting", { key, value: newValue });
    invalidateDatabaseQueries("getUserSettings");
  };
}

import hooks from "ui/hooks";

import ApiKeysPanel from "../../APIKeys";

export function ApiKeys() {
  const { userSettings } = hooks.useGetUserSettings();
  const { addUserApiKey, loading: addLoading, error: addError } = hooks.useAddUserApiKey();
  const { deleteUserApiKey } = hooks.useDeleteUserApiKey();

  return (
    <ApiKeysPanel
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

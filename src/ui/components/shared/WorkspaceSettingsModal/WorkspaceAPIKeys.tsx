import React from "react";
import hooks from "ui/hooks";

import APIKeys from "../APIKeys";

export default function WorkspaceAPIKeys({ workspaceId }: { workspaceId: string }) {
  const {
    addWorkspaceApiKey,
    loading: addLoading,
    error: addError,
  } = hooks.useAddWorkspaceApiKey();
  const { deleteWorkspaceApiKey } = hooks.useDeleteWorkspaceApiKey();
  const { data } = hooks.useGetWorkspaceApiKeys(workspaceId);

  if (!data) return null;

  return (
    <APIKeys
      apiKeys={data.node.apiKeys}
      description="API Keys allow you to upload recordings programmatically from your automated tests or from your continuous integration environment or upload source maps for sites that do not publish their source maps."
      loading={addLoading}
      error={addError}
      addKey={(label, scopes) =>
        addWorkspaceApiKey({
          variables: { label, scopes, workspaceId },
        }).then(resp => resp.data.createWorkspaceAPIKey)
      }
      scopes={["admin:all", "write:sourcemap"]}
      deleteKey={id => deleteWorkspaceApiKey({ variables: { id } })}
    />
  );
}

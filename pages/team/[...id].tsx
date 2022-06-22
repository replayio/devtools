import { useRouter } from "next/router";
import React, { useEffect } from "react";
import * as actions from "ui/actions/app";
import Account from "ui/components/Account";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export default function TeamPage() {
  const { isAuthenticated } = useAuth0();
  const { setWorkspaceId, setModal } = actions;
  const dispatch = useAppDispatch();
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();
  const { query, replace } = useRouter();

  const [workspaceId, modal, view] = Array.isArray(query.id) ? query.id : [query.id];

  useEffect(() => {
    if (workspaceId && isAuthenticated) {
      dispatch(actions.setWorkspaceId(workspaceId));
      updateDefaultWorkspace({
        variables: {
          workspaceId,
        },
      });

      replace("/");
    }
  }, [isAuthenticated, workspaceId, replace, setWorkspaceId, updateDefaultWorkspace, dispatch]);

  useEffect(() => {
    if (isAuthenticated && workspaceId && modal === "settings") {
      dispatch(setModal("workspace-settings", view ? { view } : null));
    }
  }, [isAuthenticated, workspaceId, modal, view, setModal, dispatch]);

  return <Account />;
}

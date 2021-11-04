import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import Account from "ui/components/Account";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import useAuth0 from "ui/utils/useAuth0";

function TeamPage({ setWorkspaceId, setModal }: PropsFromRedux) {
  const { isAuthenticated } = useAuth0();
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();
  const { query, replace } = useRouter();

  const [, workspaceId, modal, view] = Array.isArray(query.team) ? query.team : [];

  useEffect(() => {
    if (workspaceId) {
      updateDefaultWorkspace({
        variables: {
          workspaceId,
        },
      });
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && modal === "settings") {
      setWorkspaceId(workspaceId);
      setModal("workspace-settings", view ? { view } : null);
    }
  }, [workspaceId, modal, view]);

  if (!isAuthenticated || !workspaceId) {
    replace("/");
    return null;
  }

  return <Account />;
}

const connector = connect(null, {
  setWorkspaceId: actions.setWorkspaceId,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamPage);

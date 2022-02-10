import { useRouter } from "next/router";
import React, { FC, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import Account from "ui/components/Account";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import useAuth0 from "ui/utils/useAuth0";

const TeamPage: FC<PropsFromRedux> = ({ setWorkspaceId, setModal }) => {
  const { isAuthenticated } = useAuth0();
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();
  const { query, replace } = useRouter();

  const [workspaceId, modal, view] = Array.isArray(query.id) ? query.id : [query.id];

  useEffect(() => {
    if (workspaceId && isAuthenticated) {
      setWorkspaceId(workspaceId);
      updateDefaultWorkspace({
        variables: {
          workspaceId,
        },
      });

      replace("/");
    }
  }, [isAuthenticated, workspaceId, replace, setWorkspaceId, updateDefaultWorkspace]);

  useEffect(() => {
    if (isAuthenticated && workspaceId && modal === "settings") {
      setModal("workspace-settings", view ? { view } : null);
    }
  }, [isAuthenticated, workspaceId, modal, view, setModal]);

  return <Account />;
};

const connector = connect(null, {
  setWorkspaceId: actions.setWorkspaceId,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamPage);

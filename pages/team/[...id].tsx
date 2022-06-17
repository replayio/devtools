import { useRouter } from "next/router";
import React, { useEffect } from "react";
import * as actions from "ui/actions/app";
import Account from "ui/components/Account";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

function useGetTestParams() {
  const { query } = useRouter();
  const [workspaceId, view, testRunId] = Array.isArray(query.id) ? query.id : [query.id];

  return { testRunId };
}

export default function TeamPage() {
  const { isAuthenticated } = useAuth0();
  const { setWorkspaceId, setModal } = actions;
  // This is not pretty but it gets the job done. There's a restructuring of how we
  // think about pages/routes if we were to do this the right way. Todo: That.
  const { testRunId } = useGetTestParams();
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

      if (testRunId) {
        return;
      }

      replace("/");
    }
  }, [
    isAuthenticated,
    workspaceId,
    replace,
    setWorkspaceId,
    updateDefaultWorkspace,
    dispatch,
    testRunId,
  ]);

  useEffect(() => {
    if (isAuthenticated && workspaceId && modal === "settings") {
      dispatch(setModal("workspace-settings", view ? { view } : null));
    }
  }, [isAuthenticated, workspaceId, modal, view, setModal, dispatch]);

  return <Account testRunId={testRunId} />;
}

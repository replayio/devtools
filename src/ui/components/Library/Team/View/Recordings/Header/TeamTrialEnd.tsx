import { useRouter } from "next/router";
import React from "react";

import { setModal } from "ui/actions/app";
import hooks from "ui/hooks";
import { useAppDispatch } from "ui/setup/hooks";
import { subscriptionEndsIn } from "ui/utils/workspace";

import { TrialEnd } from "../../../../../shared/TrialEnd";

export default function TeamTrialEnd({ currentWorkspaceId }: { currentWorkspaceId: string }) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const dispatch = useAppDispatch();
  const { members } = hooks.useGetWorkspaceMembers(currentWorkspaceId);
  const router = useRouter();
  const { userId: localUserId } = hooks.useGetUserId();

  if (loading) {
    return null;
  }

  const workspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!workspace?.subscription?.trialEnds) {
    return null;
  }

  const roles = members?.find(m => m.userId === localUserId)?.roles;
  const isAdmin = roles?.includes("admin") || false;
  const onClick = isAdmin
    ? () => {
        router.push(`/team/${currentWorkspaceId}/settings/billing`);
        dispatch(setModal("workspace-settings"));
      }
    : undefined;

  const expiresIn = subscriptionEndsIn(workspace);

  return (
    <TrialEnd
      expiresIn={expiresIn}
      color="yellow"
      className="cursor-pointer py-2"
      onClick={onClick}
    />
  );
}

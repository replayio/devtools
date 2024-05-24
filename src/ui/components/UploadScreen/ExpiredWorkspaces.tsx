import { Workspace } from "shared/graphql/types";
import { useGetUserId } from "ui/hooks/users";
import { subscriptionExpired } from "ui/utils/workspace";

import styles from "./ExpiredWorkspaces.module.css";

export default function ExpiredWorkspaces({ workspaces }: { workspaces: Workspace[] }) {
  const { userId } = useGetUserId();

  const expiredWorkspaces = workspaces.filter(workspace => subscriptionExpired(workspace));

  if (expiredWorkspaces.length === 0) {
    return null;
  }

  const message =
    expiredWorkspaces.length === 1
      ? `The workspace "${expiredWorkspaces[0].name}" has expired.`
      : "Multiple workspaces have expired.";

  const expiredWorkspaceWithAdminRights = expiredWorkspaces.find(workspace => {
    const membership = workspace.members?.find(member => member.userId === userId);
    return membership?.roles?.includes("admin");
  });

  return (
    <div className={styles.wrapper}>
      <span className={styles.warning}>Warning: </span>
      {message}
      {expiredWorkspaceWithAdminRights && (
        <a
          href={`/team/${expiredWorkspaceWithAdminRights.id}/settings/billing`}
          target="_blank"
          rel="noreferrer"
        >
          Go to billing page
        </a>
      )}
    </div>
  );
}

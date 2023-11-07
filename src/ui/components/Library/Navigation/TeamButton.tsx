import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent } from "react";

import { setModal } from "ui/actions/app";
import { MY_LIBRARY_TEAM } from "ui/components/Library/Team/TeamContextRoot";
import Icon from "ui/components/shared/Icon";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import styles from "../Library.module.css";

export function TeamButton({
  label,
  id,
  isTest,
  isNew,
}: {
  label?: string;
  id: string | null;
  isNew?: boolean;
  isTest?: boolean;
}) {
  const router = useRouter();
  const basePath = `/team/${id}`;
  const url = `${basePath}/${isTest ? "runs" : "recordings"}`;
  const isSelected = router.asPath.includes(basePath);
  const showSettingsButton = isSelected && id && id !== MY_LIBRARY_TEAM.id && !isNew;
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();

  const onClick = async () => {
    if (isNew) {
      return;
    }

    await updateDefaultWorkspace({
      variables: { workspaceId: id === MY_LIBRARY_TEAM.id ? MY_LIBRARY_TEAM.databaseId : id },
    });
    await trackEvent("team_change", { workspaceId: id });
  };

  return (
    <div
      className={classNames(
        `flex flex-col ${styles.teamRow} `,
        isSelected ? `${styles.teamRowActive}` : ""
      )}
    >
      <Link
        href={url}
        className={classNames(
          `group flex flex-row justify-between space-x-2 px-4 py-2 text-left transition duration-200 hover:text-white focus:outline-none`,
          isSelected ? `cursor-auto` : "cursor-pointer"
        )}
        onClick={onClick}
      >
        <span className="overflow-hidden overflow-ellipsis whitespace-pre">
          <div className="flex">
            <LibraryIcon teamType={isTest ? "tests" : "team"} />
            {label}
          </div>
        </span>
        {isNew ? (
          <div className={"rounded-md bg-primaryAccent px-3 py-0.5 text-xs text-white"}>New</div>
        ) : null}
        {showSettingsButton ? <SettingsButton /> : null}
      </Link>
      {isSelected ? <TestTeamViews /> : null}
    </div>
  );
}

function TestTeamViews() {
  return (
    <div className="pl-4 pb-2">
      <div className="flex flex-col">
        <div className="px-4 py-1 font-bold">Runs</div>
      </div>
    </div>
  );
}

export function LibraryIcon({ teamType }: { teamType: string }) {
  return <Icon filename={teamType} size="medium" className="mr-1 bg-gray-200" />;
}

export function SettingsButton() {
  const dispatch = useAppDispatch();

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(setModal("workspace-settings"));
  };

  return (
    <button
      onClick={onClick}
      className="material-icons w-5 flex-shrink-0 text-sm text-gray-200 transition duration-200"
    >
      settings
    </button>
  );
}

import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent, useContext } from "react";

import { setModal } from "ui/actions/app";
import { MY_LIBRARY_TEAM } from "ui/components/Library/Team/TeamContextRoot";
import Icon from "ui/components/shared/Icon";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { useGetTeamRouteParams } from "../Team/utils";
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
        <div className="flex overflow-hidden">
          <LibraryIcon teamType={isTest ? "tests" : "team"} />
          <span className="overflow-hidden overflow-ellipsis whitespace-pre">{label}</span>
        </div>
        {isNew ? (
          <div className={"rounded-md bg-primaryAccent px-3 py-0.5 text-xs text-white"}>New</div>
        ) : null}
        {showSettingsButton ? <SettingsButton /> : null}
      </Link>
      {isSelected && isTest ? <TestTeamViews /> : null}
    </div>
  );
}

function TestTeamViews() {
  const view = useGetTeamRouteParams().view;
  const { teamId } = useGetTeamRouteParams();

  return (
    <div className="pl-4">
      <div className="flex flex-col">
        <Link
          href={`/team/${teamId}/runs`}
          className={`py-1 pr-4 pl-6 ${view === "runs" ? "font-bold" : ""} hover:cursor-pointer`}
        >
          Runs
        </Link>
        <Link
          href={`/team/${teamId}/tests`}
          className={`py-1 pr-4 pl-6 ${view === "tests" ? "font-bold" : ""} hover:cursor-pointer`}
        >
          Tests
        </Link>
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

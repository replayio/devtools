import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent } from "react";
import { setModal } from "ui/actions/app";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { useAppDispatch } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import styles from "../Library.module.css";
import { MY_LIBRARY_TEAM } from "../Team/TeamContextRoot";

export function TeamButton({
  label,
  id,
  isTest,
  isNew,
}: {
  label: string;
  id: string | null;
  isNew?: boolean;
  isTest?: boolean;
}) {
  const router = useRouter();
  const basePath = `/team/${id}`;
  const url = `${basePath}/${isTest ? "runs" : "recordings"}`;
  const isSelected = router.asPath.includes(basePath);
  const showSettingsButton = id && isSelected && !isNew;
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();

  const onClick = () => {
    if (isNew) {
      return;
    }

    updateDefaultWorkspace({
      variables: { workspaceId: id === MY_LIBRARY_TEAM.id ? MY_LIBRARY_TEAM.databaseId : id },
    });
    trackEvent("team_change", { workspaceId: id });
  };

  return (
    <Link href={url}>
      <a
        className={classNames(
          `${styles.teamRow} group flex flex-row justify-between space-x-2 px-4 py-2 text-left transition duration-200 hover:text-white focus:outline-none`,
          isSelected ? `${styles.teamRowActive} cursor-auto font-bold` : "cursor-pointer"
        )}
        onClick={onClick}
      >
        <span className="overflow-hidden overflow-ellipsis whitespace-pre">
          {label} {isTest && "(test)"}
        </span>
        {isNew ? (
          <div className={"rounded-lg bg-primaryAccent px-3 py-0.5 text-xs text-white"}>New</div>
        ) : null}
        {showSettingsButton ? <SettingsButton /> : null}
      </a>
    </Link>
  );
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
      className="material-icons w-5 text-sm text-gray-200 transition duration-200"
    >
      settings
    </button>
  );
}

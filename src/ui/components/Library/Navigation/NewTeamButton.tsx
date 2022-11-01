import classNames from "classnames";

import { setModal } from "ui/actions/app";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "../Library.module.css";

export function NewTeamButton() {
  const dispatch = useAppDispatch();
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(setModal("new-workspace"));
  };

  return (
    <a
      className={classNames(
        `${styles.teamRow} group flex flex-row justify-between space-x-2 px-4 py-2 text-left underline transition duration-200 hover:cursor-pointer focus:outline-none`
      )}
      onClick={onClick}
    >
      Create new team
    </a>
  );
}

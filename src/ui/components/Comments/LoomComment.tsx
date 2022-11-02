import { setModal } from "ui/actions/app";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./LoomComment.module.css";

export default function LoomComment({ loomUrl }: { loomUrl: string }) {
  const dispatch = useAppDispatch();
  const showLoom = () => {
    dispatch(setModal("loom", { loom: loomUrl }));
  };
  return (
    <img
      className={styles.Image}
      onClick={showLoom}
      src={`https://cdn.loom.com/sessions/thumbnails/${loomUrl}-with-play.jpg`}
    />
  );
}

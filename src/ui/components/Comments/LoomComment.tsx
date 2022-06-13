import { useDispatch } from "react-redux";
import { setModal } from "ui/actions/app";

import styles from "./LoomComment.module.css";

export default function LoomComment({ loomUrl }: { loomUrl: string }) {
  const dispatch = useDispatch();
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

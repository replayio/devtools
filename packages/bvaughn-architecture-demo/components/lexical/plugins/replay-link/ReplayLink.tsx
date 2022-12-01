import { ReplayLinkNode } from "./ReplayLinkNode";
import styles from "./ReplayLink.module.css";

export default function ReplayLink({ url }: { url: string }): JSX.Element {
  const title = ReplayLinkNode.urlToTitle(url);

  return (
    <a className={styles.Link} href={url} rel="noreferrer" target="_blank">
      replay: {title}
    </a>
  );
}

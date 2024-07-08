import ExternalLink from "replay-next/components/ExternalLink";
import { getSelectedSource } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./SourcemapSetup.module.css";

const isNextUrl = (url: string | undefined) => url && url.includes("/_next/");

export default function SourcemapSetup() {
  const { url } = useAppSelector(getSelectedSource)!;
  const isNext = isNextUrl(url);

  if (isNext) {
    return (
      <div className={styles.Text}>
        <div>
          We noticed that you're using NextJS which makes adding sourcemaps easy.{" "}
          <ExternalLink className={styles.Link} href="https://docs.replay.io/resources/next-js">
            Click here
          </ExternalLink>{" "}
          for help uploading them to Replay.
        </div>
        <div>If you think there's another problem, tell us about it below.</div>
      </div>
    );
  } else {
    return (
      <div className={styles.Text}>
        <div>
          Your source references sourcemaps but they are not publicly available.{" "}
          <ExternalLink
            className={styles.Link}
            href="https://docs.replay.io/getting-started/teams-admin/uploading-source-maps"
          >
            Click here
          </ExternalLink>{" "}
          for help uploading them to Replay.
        </div>
        <div>If you think there's another problem, tell us about it below.</div>
      </div>
    );
  }
}

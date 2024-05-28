import { PropsWithChildren, ReactNode, Suspense } from "react";
import { useStreamingValue } from "suspense";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import ExternalLink from "replay-next/components/ExternalLink";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { TimeoutCache } from "replay-next/src/suspense/TimeoutCache";

import { ReactDevToolsPanel } from "./react-devtools/components/ReactDevToolsPanel";
import styles from "./ReactDevTools.module.css";

export default function ReactDevToolsWithErrorBoundary() {
  const { point, pauseId } = useMostRecentLoadedPause() ?? {};

  return (
    <InlineErrorBoundary name="ReactDevTools" resetKey={pauseId ?? ""}>
      <SuspenseWithLoadingStalledMessage>
        <ReactDevToolsPanel executionPoint={point ?? null} pauseId={pauseId ?? null} />
      </SuspenseWithLoadingStalledMessage>
    </InlineErrorBoundary>
  );
}

function SuspenseWithLoadingStalledMessage({ children }: PropsWithChildren) {
  let message: ReactNode | undefined = undefined;

  const { value: showShortMessage } = useStreamingValue(
    TimeoutCache.stream("react:annotations-loading-stalled:short", 30_000)
  );
  const { value: showLongMessage } = useStreamingValue(
    TimeoutCache.stream("react:annotations-loading-stalled:long", 300_000)
  );

  if (showLongMessage) {
    message = (
      <div className={styles.Messages}>
        <p className={styles.Message}>This is taking longer than we expected.</p>
        <p className={styles.Message}>Something may have gone wrong.</p>
        <p className={styles.Message}>
          Contact us{" "}
          <ExternalLink className={styles.DiscordLink} href="https://discord.gg/n2dTK6kcRX">
            on Discord
          </ExternalLink>{" "}
          if you need more assistance.
        </p>
      </div>
    );
  } else if (showShortMessage) {
    message = <p className={styles.Message}>This is taking longer than expected.</p>;
  }

  return <Suspense fallback={<PanelLoader message={message} />}>{children}</Suspense>;
}

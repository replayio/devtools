import styles from "./MissingStepsBanner.module.css";

export function MissingStepsBanner({ testRunnerName }: { testRunnerName: string }) {
  return (
    <aside className={styles.Banner}>
      <div>
        <strong>👋 Hey there!</strong>
      </div>
      <div>
        You seem to be missing test steps for this replay. You'll still be able to use the core
        Replay tools but adding test steps will give you a much better debugging experience.
      </div>
      {testRunnerName === "cypress" ? (
        <div>
          This usually means you need to include the <code>@replayio/cypress/support</code> module
          in your project's support file. More information is available in our{" "}
          <a
            className="underline"
            href="https://docs.replay.io/recording-browser-tests-(beta)/cypress-instructions"
            target="_blank"
            rel="noreferrer"
          >
            docs
          </a>
          .
        </div>
      ) : null}
      <div>
        If you're stuck, reach out to us over{" "}
        <a className="underline" href="mailto:support@replay.io" target="_blank" rel="noreferrer">
          email
        </a>{" "}
        or{" "}
        <a href="https://replay.io/discord" className="underline" target="_blank" rel="noreferrer">
          discord
        </a>{" "}
        and we can help you get set up.
      </div>
    </aside>
  );
}

import { ReactNode, Suspense, useContext, useState } from "react";

import { ModalFrame } from "replay-next/components/errors/ModalFrame";
import { SupportContext } from "replay-next/components/errors/SupportContext";
import { useSessionId } from "replay-next/components/errors/useSessionId";
import Expandable from "replay-next/components/Expandable";
import ExternalLink from "replay-next/components/ExternalLink";
import Icon from "replay-next/components/Icon";
import { buildIdCache, parseBuildIdComponents } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientInterface } from "shared/client/types";

import styles from "./UnexpectedErrorForm.module.css";

// Full screen modal to be shown in the event of an unexpected error that is fatal/blocking.
// It will show a contact form so the user can send additional repro steps.
// If additional error details can be shown, they should be passed in as props.

type Props = {
  details?: ReactNode;
  replayClient: ReplayClientInterface;
  title: ReactNode;
  unexpectedError: any;
};

export function UnexpectedErrorForm(props: Props) {
  return (
    <Suspense>
      <UnexpectedErrorFormSuspends {...props} />
    </Suspense>
  );
}

function UnexpectedErrorFormSuspends({ details, replayClient, title, unexpectedError }: Props) {
  const { showSupportForm, state: supportFormState } = useContext(SupportContext);

  const sessionId = useSessionId(replayClient);

  const [showErrorDetails, setShowErrorDetails] = useState(false);

  let isWindows = false;
  if (sessionId) {
    // Build info comes from Session.getBuildId which can only be queried for users with sessions
    // This dialog may be shown before a session has been created, so don't rely on it
    const buildId = buildIdCache.read(replayClient);
    const buildComponents = parseBuildIdComponents(buildId);

    isWindows = buildComponents?.platform === "windows";
  }

  const onSubmitTicketClick = () => {
    showSupportForm({
      context: {
        id: "unexpected-error",
        unexpectedError,
      },
      promptText: "",
      title: "Submit a ticket",
    });
  };

  return (
    <ModalFrame
      dataTestId="UnexpectedErrorDetails"
      showCloseButton={!!supportFormState}
      title={<span data-test-name="ErrorTitle">{title}</span>}
    >
      {isWindows ? (
        <div className={styles.Message}>
          We're seeing high crash rates on recordings made with our Windows browser, but are hard at
          work on a Chrome-based version.
          <br />
          <br />
          Thank you for your patience!
        </div>
      ) : (
        <div className={styles.Message}>
          <div>Apologies, something went wrong.</div>
          <div>We'll look into it shortly.</div>
        </div>
      )}
      <div className={styles.Buttons}>
        <button className={styles.Button} onClick={onSubmitTicketClick}>
          <Icon className={styles.ButtonIcon} type="submit-ticket" />
          <div>Submit a ticket</div>
        </button>
        <ExternalLink className={styles.Button} href="https://discord.gg/n2dTK6kcRX">
          <Icon className={styles.ButtonIcon} type="discord" />
          <div>Contact us on Discord</div>
        </ExternalLink>
      </div>

      {details && (
        <div className={styles.Details}>
          <Expandable
            children={null}
            defaultOpen={showErrorDetails}
            header={showErrorDetails ? "Hide error details" : "See error details"}
            onChange={setShowErrorDetails}
          />

          {showErrorDetails && (
            <div className={styles.DetailsText} data-test-name="ErrorDetails">
              {details}
            </div>
          )}
        </div>
      )}
    </ModalFrame>
  );
}

import { ReactNode, Suspense, useState } from "react";

import { ModalFrame } from "replay-next/components/errors/ModalFrame";
import { SupportForm } from "replay-next/components/errors/SupportForm";
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
  currentUserEmail: string | null;
  currentUserId: string | null;
  currentUserName: string | null;
  details?: ReactNode;
  replayClient: ReplayClientInterface;
  title: ReactNode;
};

export function UnexpectedErrorForm(props: Props) {
  return (
    <Suspense>
      <UnexpectedErrorFormSuspends {...props} />
    </Suspense>
  );
}

function UnexpectedErrorFormSuspends({
  currentUserEmail,
  currentUserId,
  currentUserName,
  details,
  replayClient,
  title,
}: Props) {
  const sessionId = useSessionId(replayClient);

  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  if (showContactForm) {
    const onDismiss = () => {
      setShowContactForm(false);
    };

    return (
      <SupportForm
        currentUserEmail={currentUserEmail}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onDismiss={onDismiss}
        placeholder=""
        replayClient={replayClient}
        title="Submit a ticket"
      />
    );
  }

  let isWindows = false;
  if (sessionId) {
    // Build info comes from Session.getBuildId which can only be queried for users with sessions
    // This dialog may be shown before a session has been created, so don't rely on it
    const buildId = buildIdCache.read(replayClient);
    const buildComponents = parseBuildIdComponents(buildId);

    isWindows = buildComponents?.platform === "windows";
  }

  const onSubmitTicketClick = () => {
    setShowContactForm(true);
  };

  return (
    <ModalFrame
      dataTestId="UnexpectedErrorDetails"
      onDismiss={noop}
      showCloseButton={showContactForm}
      title={title}
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

          {showErrorDetails && <div className={styles.DetailsText}>{details}</div>}
        </div>
      )}
    </ModalFrame>
  );
}

function noop() {}

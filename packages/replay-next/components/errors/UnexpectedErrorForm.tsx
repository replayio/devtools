import { ReactNode } from "react";

import { SupportForm } from "replay-next/components/support/SupportForm";
import { ReplayClientInterface } from "shared/client/types";

import styles from "./UnexpectedErrorForm.module.css";

// Full screen modal to be shown in the event of an unexpected error that is fatal/blocking.
// It will show a contact form so the user can send additional repro steps.
// If additional error details can be shown, they should be passed in as props.

export function UnexpectedErrorForm({
  currentUserEmail,
  currentUserId,
  currentUserName,
  details,
  replayClient,
  title,
}: {
  currentUserEmail: string | null;
  currentUserId: string | null;
  currentUserName: string | null;
  details?: ReactNode;
  replayClient: ReplayClientInterface;
  title: ReactNode;
}) {
  return (
    <SupportForm
      currentUserEmail={currentUserEmail}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      details={
        <>
          {details && <div className={styles.Details}>{details}</div>}
          <div>
            We've sent this crash to our team. Please add any details that might help us diagnose
            and fix this issue.
          </div>
        </>
      }
      replayClient={replayClient}
      title={title}
    />
  );
}

import { ReactNode } from "react";

import { SupportForm } from "replay-next/components/support/SupportForm";

import styles from "./UnexpectedErrorForm.module.css";

// Full screen modal to be shown in the event of an unexpected error that is fatal/blocking.
// It will show a contact form so the user can send additional repro steps.
// If additional error details can be shown, they should be passed in as props.

export function UnexpectedErrorForm({ details, title }: { details?: ReactNode; title: ReactNode }) {
  return (
    <SupportForm
      details={
        <>
          {details && <div className={styles.Details}>{details}</div>}
          <div className={styles.Boilerplate}>
            We've sent this crash to our team. Please add any details that might help us diagnose
            and fix this issue.
          </div>
        </>
      }
      title={title}
    />
  );
}

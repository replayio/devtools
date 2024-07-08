import { ReactNode, useContext, useRef, useState } from "react";

import { ModalFrame } from "replay-next/components/errors/ModalFrame";
import { submitSupportForm } from "replay-next/components/errors/submitSupportForm";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { addCollaborator } from "shared/graphql/Recordings";

import { State } from "./SupportContext";
import styles from "./SupportForm.module.css";

export function SupportForm({ dismiss, state }: { dismiss: () => void; state: State }) {
  const { context, promptText, title } = state;

  const shareReplayCheckboxRef = useRef<HTMLInputElement>(null);

  // TRICKY
  // This component may be rendered within the unexpected error boundary fallback
  // which is outside of the normal stack of context providers
  // So it should not assume that a valid SessionContext exists
  const { accessToken, currentUserInfo, recordingId, sessionId } = useContext(SessionContext) ?? {};
  const graphQLClient = useContext(GraphQLClientContext);

  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "failure" | "success">(null);
  const [text, setText] = useState("");

  const onDismissWithConfirmation = () => {
    if (text) {
      setShowConfirmationPrompt(true);
    } else {
      dismiss();
    }
  };

  const onSubmitButtonClick = async () => {
    if (text) {
      try {
        const shareWithReplaySupport = !!shareReplayCheckboxRef.current?.checked;
        if (shareWithReplaySupport) {
          if (graphQLClient && accessToken) {
            try {
              await addCollaborator(graphQLClient, accessToken, recordingId, "support@replay.io");
            } catch (error) {}
          }
        }

        await submitSupportForm({
          context,
          currentUser: currentUserInfo,
          shareWithReplaySupport,
          sessionId,
          text,
        });

        setSubmitStatus("success");
      } catch (error) {
        setSubmitStatus("failure");
      } finally {
        setText("");
      }
    }
  };

  let confirmationMessage = null;
  switch (submitStatus) {
    case "failure":
      confirmationMessage = "Something went wrong. Please reload the page and try again.";
      break;
    case "success":
      if (currentUserInfo?.email) {
        confirmationMessage = `Thank you for your note. We'll get back to you at ${currentUserInfo?.email} as soon as possible.`;
      } else {
        confirmationMessage = "Thank you for your note.";
      }
      break;
  }

  let formContent: ReactNode = null;
  if (confirmationMessage) {
    formContent = <div className={styles.ConfirmationMessage}>{confirmationMessage}</div>;
  } else {
    formContent = (
      <>
        <div className={styles.Form}>
          <textarea
            autoFocus
            className={styles.TextArea}
            disabled={showConfirmationPrompt}
            onChange={event => setText(event.target.value)}
            placeholder={promptText}
            value={text}
          />
          <label className={styles.ShareOption} data-disabled={showConfirmationPrompt || undefined}>
            <input
              className={styles.Checkbox}
              defaultChecked
              disabled={showConfirmationPrompt}
              ref={shareReplayCheckboxRef}
              type="checkbox"
            />
            Allow Replay support to view this recording
          </label>
        </div>
      </>
    );
  }

  let formActions: ReactNode = null;
  if (showConfirmationPrompt) {
    const onCancelButtonClick = () => {
      setShowConfirmationPrompt(false);
    };

    const onCloseButtonClick = () => {
      dismiss();

      setShowConfirmationPrompt(false);
    };

    formActions = (
      <div className={styles.FormActions} data-confirmation>
        <button className={styles.CancelCloseButton} color="blue" onClick={onCancelButtonClick}>
          Resume editing
        </button>
        <button className={styles.CloseButton} color="pink" onClick={onCloseButtonClick}>
          Discard message
        </button>
      </div>
    );
  } else {
    formActions = (
      <div className={styles.FormActions}>
        <button
          className={styles.SubmitButton}
          color="blue"
          disabled={!text}
          onClick={onSubmitButtonClick}
        >
          Submit
        </button>
      </div>
    );
  }

  return (
    <ModalFrame
      dataTestId="SupportForm"
      onDismiss={onDismissWithConfirmation}
      showCloseButton={!showConfirmationPrompt}
      title={title}
    >
      {formContent}
      {formActions}
    </ModalFrame>
  );
}

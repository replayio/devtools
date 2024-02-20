import { ReactNode, useState } from "react";

import { ModalFrame } from "replay-next/components/errors/ModalFrame";
import { submitSupportForm } from "replay-next/components/errors/submitSupportForm";
import { useSessionId } from "replay-next/components/errors/useSessionId";
import { ReplayClientInterface } from "shared/client/types";

import styles from "./SupportForm.module.css";

export function SupportForm({
  currentUserEmail,
  currentUserId,
  currentUserName,
  onDismiss,
  placeholder = "Bugs, suggestions, questions are all welcome!",
  replayClient,
  title = "Support",
}: {
  currentUserEmail: string | null;
  currentUserId: string | null;
  currentUserName: string | null;
  onDismiss: () => void;
  placeholder?: string;
  replayClient: ReplayClientInterface;
  title?: ReactNode;
}) {
  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "failure" | "success">(null);
  const [text, setText] = useState("");

  const sessionId = useSessionId(replayClient);

  const onDismissWithConfirmation = () => {
    if (text) {
      setShowConfirmationPrompt(true);
    } else {
      onDismiss();
    }
  };

  let content: ReactNode = null;
  if (showConfirmationPrompt) {
    const onCancelButtonClick = () => {
      setShowConfirmationPrompt(false);
    };

    const onCloseButtonClick = () => {
      if (onDismiss) {
        onDismiss();
      }

      setShowConfirmationPrompt(false);
    };

    content = (
      <div className={styles.FormActions} data-confirmation>
        <button className={styles.CancelCloseButton} color="blue" onClick={onCancelButtonClick}>
          No
        </button>
        <button className={styles.CloseButton} color="pink" onClick={onCloseButtonClick}>
          Yes, delete it
        </button>
      </div>
    );
  } else {
    const onSubmitButtonClick = async () => {
      if (text) {
        try {
          await submitSupportForm(
            sessionId,
            text,
            currentUserEmail && currentUserId && currentUserName
              ? {
                  email: currentUserEmail,
                  id: currentUserId,
                  name: currentUserName,
                }
              : null
          );

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
        if (currentUserEmail) {
          confirmationMessage = `Thank you for your note. We'll get back to you at ${currentUserEmail} as soon as possible.`;
        } else {
          confirmationMessage = "Thank you for your note.";
        }
        break;
    }

    if (confirmationMessage) {
      content = <div className={styles.ConfirmationMessage}>{confirmationMessage}</div>;
    } else {
      content = (
        <>
          <textarea
            autoFocus
            className={styles.TextArea}
            onChange={event => setText(event.target.value)}
            placeholder={placeholder}
            value={text}
          />
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
        </>
      );
    }
  }

  return (
    <ModalFrame
      dataTestId="SupportForm"
      onDismiss={onDismissWithConfirmation}
      showCloseButton={!showConfirmationPrompt}
      title={showConfirmationPrompt ? "Cancel this support ticket?" : title}
    >
      {content}
    </ModalFrame>
  );
}

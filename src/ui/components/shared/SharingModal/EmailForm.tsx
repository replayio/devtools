import { RecordingId } from "@replayio/protocol";
import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import Spinner from "../Spinner";
import { CheckCircleIcon, PaperAirplaneIcon, ExclamationCircleIcon } from "@heroicons/react/solid";
import { validateEmail } from "ui/utils/helpers";
import { TextInput } from "../Forms";

type ActionStatus = "pending" | "loading" | "error" | "completed";

function AutocompleteAction({
  status,
  handleSubmit,
}: {
  status: ActionStatus;
  handleSubmit: () => void;
}) {
  if (status === "loading") {
    return (
      <button
        className="inline-flex items-center space-x-1.5 rounded-md border border-transparent bg-primaryAccent px-2.5 py-1.5 font-medium text-buttontextColor focus:outline-none"
        disabled
      >
        <Spinner className="w-4 h-4 animate-spin text-buttontextColor" />
        <span>Inviting</span>
      </button>
    );
  } else if (status === "completed") {
    return (
      <button
        className="inline-flex items-center space-x-1 rounded-md border border-transparent bg-green-600 px-2.5 py-1.5 font-medium text-buttontextColor focus:outline-none"
        disabled
      >
        <CheckCircleIcon className="w-4 h-4 text-buttontextColor" />
        <span>Invited</span>
      </button>
    );
  } else if (status === "error") {
    return (
      <button
        className="inline-flex items-center space-x-1 rounded-md border border-transparent bg-red-600 px-2.5 py-1.5 font-medium text-buttontextColor focus:outline-none"
        disabled
      >
        <ExclamationCircleIcon className="w-4 h-4 text-buttontextColor" />
        <span>Unknown User</span>
      </button>
    );
  }

  return (
    <button
      className="inline-flex items-center space-x-1 rounded-md border border-transparent bg-primaryAccent px-2.5 py-1.5 font-medium text-buttontextColor hover:bg-primaryAccentHover focus:outline-none"
      onClick={handleSubmit}
    >
      <PaperAirplaneIcon className="w-4 h-4 transform rotate-90 text-buttontextColor" />
      <span>Add</span>
    </button>
  );
}

export default function EmailForm({ recordingId }: { recordingId: RecordingId }) {
  const [inputValue, setInputValue] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [status, setStatus] = useState<ActionStatus>("pending");
  const { addNewCollaborator } = hooks.useAddNewCollaborator(
    function onCompleted() {
      setStatus("completed");
      delayedReset();
    },
    function onError() {
      setStatus("error");
      delayedReset();
    }
  );

  const delayedReset = () => {
    setTimeout(() => {
      setStatus("pending");
      setShowAutocomplete(false);
      setInputValue("");
    }, 2000);
  };

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    setInputValue(newValue);

    if (validateEmail(newValue)) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Don't submit if the email is not a valid email
    if (!validateEmail(inputValue)) {
      return;
    }

    addNewCollaborator({
      variables: { recordingId, email: inputValue },
    });
    setStatus("loading");
  };

  return (
    <form className="new-collaborator-form" onSubmit={handleSubmit}>
      <TextInput placeholder="Email address" value={inputValue} onChange={onChange} data-private />
      {showAutocomplete ? (
        <div className="autocomplete bg-themeTextFieldBgcolor text-themeTextFieldColor">
          <div className="content">{inputValue}</div>
          <AutocompleteAction {...{ status, handleSubmit }} />
        </div>
      ) : null}
    </form>
  );
}

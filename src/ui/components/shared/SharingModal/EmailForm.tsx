import { RecordingId } from "@recordreplay/protocol";
import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import Spinner from "../Spinner";
import { CheckCircleIcon, PaperAirplaneIcon, ExclamationCircleIcon } from "@heroicons/react/solid";
import "./EmailForm.css";
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
        className="inline-flex items-center px-2.5 py-1.5 space-x-1.5 border border-transparent font-medium rounded-md focus:outline-none text-white bg-primaryAccent"
        disabled
      >
        <Spinner className="animate-spin h-4 w-4 text-white" />
        <span>Inviting</span>
      </button>
    );
  } else if (status === "completed") {
    return (
      <button
        className="inline-flex items-center px-2.5 py-1.5 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-green-600"
        disabled
      >
        <CheckCircleIcon className="h-4 w-4 text-white" />
        <span>Invited</span>
      </button>
    );
  } else if (status === "error") {
    return (
      <button
        className="inline-flex items-center px-2.5 py-1.5 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-red-600"
        disabled
      >
        <ExclamationCircleIcon className="h-4 w-4 text-white" />
        <span>Unknown User</span>
      </button>
    );
  }

  return (
    <button
      className="inline-flex items-center px-2.5 py-1.5 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-primaryAccent hover:bg-primaryAccentHover"
      onClick={handleSubmit}
    >
      <PaperAirplaneIcon className="h-4 w-4 text-white transform rotate-90" />
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
        <div className="autocomplete bg-white">
          <div className="content">{inputValue}</div>
          <AutocompleteAction {...{ status, handleSubmit }} />
        </div>
      ) : null}
    </form>
  );
}

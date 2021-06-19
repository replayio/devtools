import { RecordingId } from "@recordreplay/protocol";
import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import Spinner from "../Spinner";
import { CheckCircleIcon, PaperAirplaneIcon, ExclamationCircleIcon } from "@heroicons/react/solid";
import "./EmailForm.css";
import { validateEmail } from "ui/utils/helpers";

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
        className="inline-flex items-center px-3 py-2 space-x-2 border border-transparent font-medium rounded-md focus:outline-none text-white bg-primaryAccent"
        disabled
      >
        <Spinner className="animate-spin h-6 w-6 text-white" />
        <span>Inviting</span>
      </button>
    );
  } else if (status === "completed") {
    return (
      <button
        className="inline-flex items-center px-3 py-2 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-green-600"
        disabled
      >
        <CheckCircleIcon className="h-6 w-6 text-white" />
        <span>Invited</span>
      </button>
    );
  } else if (status === "error") {
    return (
      <button
        className="inline-flex items-center px-3 py-2 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-red-600"
        disabled
      >
        <ExclamationCircleIcon className="h-6 w-6 text-white" />
        <span>Unknown User</span>
      </button>
    );
  }

  return (
    <button
      className="inline-flex items-center px-3 py-2 space-x-1 border border-transparent font-medium rounded-md focus:outline-none text-white bg-primaryAccent hover:bg-primaryAccentHover"
      onClick={handleSubmit}
    >
      <PaperAirplaneIcon className="h-6 w-6 text-white transform rotate-90" />
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
      setTimeout(() => {
        setStatus("pending");
        setShowAutocomplete(false);
      }, 2000);
    },
    function onError() {
      setStatus("error");
      setTimeout(() => {
        setStatus("pending");
        setShowAutocomplete(false);
      }, 2000);
    }
  );

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

    addNewCollaborator({
      variables: { recordingId, email: inputValue },
    });
    setStatus("loading");
  };

  return (
    <form className="new-collaborator-form" onSubmit={handleSubmit}>
      <input
        type="textarea"
        placeholder="Search emails here"
        value={inputValue}
        onChange={onChange}
      />
      {showAutocomplete ? (
        <div className="autocomplete bg-white">
          <div className="content">{inputValue}</div>
          <AutocompleteAction {...{ status, handleSubmit }} />
        </div>
      ) : null}
    </form>
  );
}

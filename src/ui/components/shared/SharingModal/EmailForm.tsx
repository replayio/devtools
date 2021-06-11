import { RecordingId } from "@recordreplay/protocol";
import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import Spinner from "../Spinner";
import { CheckCircleIcon, PaperAirplaneIcon, ExclamationCircleIcon } from "@heroicons/react/solid";
import "./EmailForm.css";

function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

type ActionStatus = "pending" | "loading" | "error" | "completed";

function AutocompleteAction({
  email,
  recordingId,
  setShowAutocomplete,
}: {
  email: string;
  recordingId: RecordingId;
  setShowAutocomplete: Dispatch<SetStateAction<boolean>>;
}) {
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

  const onClick = () => {
    addNewCollaborator({
      variables: { recordingId, email },
    });
    setStatus("loading");
  };

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
      onClick={onClick}
    >
      <PaperAirplaneIcon className="h-6 w-6 text-white transform rotate-90" />
      <span>Add</span>
    </button>
  );
}

function Autocomplete({
  email,
  recordingId,
  setShowAutocomplete,
}: {
  email: string;
  recordingId: RecordingId;
  setShowAutocomplete: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="autocomplete bg-white">
      <div className="content">{`${email}`}</div>
      <AutocompleteAction
        email={email}
        recordingId={recordingId}
        setShowAutocomplete={setShowAutocomplete}
      />
    </div>
  );
}

export default function EmailForm({ recordingId }: { recordingId: RecordingId }) {
  const [inputValue, setInputValue] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    setInputValue(newValue);

    if (validateEmail(newValue)) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  return (
    <div className="new-collaborator-form">
      <input
        type="textarea"
        placeholder="Search emails here"
        value={inputValue}
        onChange={onChange}
      />
      {showAutocomplete ? (
        <Autocomplete
          email={inputValue}
          recordingId={recordingId}
          setShowAutocomplete={setShowAutocomplete}
        />
      ) : null}
    </div>
  );
}

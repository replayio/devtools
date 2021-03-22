import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import hooks from "ui/hooks";
import { Status } from "./types";

function Fetcher({
  setStatus,
  email,
}: {
  setStatus: Dispatch<SetStateAction<Status>>;
  email: string;
}) {
  const { userId, loading, error } = hooks.useFetchCollaboratorId(email);

  useEffect(() => {
    if (!loading) {
      setStatus({ type: "fetched-user", userId, error });
    }
  });

  return <div className="row status">{loading ? "Fetching" : "Fetched"}</div>;
}

function Submitter({
  setStatus,
  userId,
  recordingId,
}: {
  setStatus: Dispatch<SetStateAction<Status>>;
  userId: string;
  recordingId: string;
}) {
  const { addNewCollaborator, loading, error } = hooks.useAddNewCollaborator();

  useEffect(() => {
    addNewCollaborator({
      variables: { objects: [{ recording_id: recordingId, user_id: userId }] },
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      setStatus({ type: "submitted-user", error });
    }
  });

  return <div className="row status">{loading ? "Submitting" : "Submitted"}</div>;
}

export default function EmailForm({ recordingId }: { recordingId: string }) {
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<Status>({ type: "input" });

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus({ type: "submitted-email" });
  };
  const ErrorHandler = ({ message }: { message: string }) => {
    setTimeout(() => {
      setStatus({ type: "input" });
      setInputValue("");
    }, 2000);

    return <div className="row status error">{message}</div>;
  };

  // The status.type progresses as follows:
  // (start) input -> submitted-email -> fetched-user -> submitted-user -> input (end)
  if (status.type === "submitted-email") {
    return <Fetcher setStatus={setStatus} email={inputValue} />;
  }

  if (status.type === "fetched-user") {
    if (status.error) {
      return <ErrorHandler message={"We can not fetch that collaborator right now."} />;
    } else if (!status.userId) {
      return <ErrorHandler message={"That e-mail address is not a valid Replay user."} />;
    }

    return <Submitter setStatus={setStatus} userId={status.userId} recordingId={recordingId} />;
  }

  if (status.type === "submitted-user") {
    if (status.error) {
      return <ErrorHandler message={"We can not add that collaborator right now."} />;
    }

    setStatus({ type: "input" });
    setInputValue("");
  }

  return (
    <form className="row">
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Add a collaborator"
      />
      <input type="submit" onClick={handleSubmit} value={"Add"} />
    </form>
  );
}

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { gql, useQuery, useMutation } from "@apollo/client";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import Modal from "ui/components/shared/Modal";
import "./SharingModal.css";

const GET_OWNER_AND_COLLABORATORS = gql`
  query GetOwnerAndCollaborators($recordingId: uuid!) {
    collaborators(where: { recording_id: { _eq: $recordingId } }) {
      user {
        email
        id
        name
        nickname
        picture
      }
      user_id
      recording_id
    }
    recordings_by_pk(id: $recordingId) {
      user {
        email
        id
        name
        nickname
        picture
      }
      id
      is_private
    }
  }
`;

const ADD_COLLABORATOR = gql`
  mutation AddCollaborator($objects: [collaborators_insert_input!]! = {}) {
    insert_collaborators(objects: $objects) {
      affected_rows
    }
  }
`;

const DELETE_COLLABORATOR = gql`
  mutation DeleteCollaborator($recordingId: uuid, $userId: uuid) {
    delete_collaborators(
      where: { _and: { recording_id: { _eq: $recordingId } }, user_id: { _eq: $userId } }
    ) {
      affected_rows
    }
  }
`;

function useFetchCollaborateorId(email) {
  const { data, loading, error } = useQuery(
    gql`
      query GetCollaboratorId($email: String = "") {
        user_id_by_email(args: { email: $email }) {
          id
        }
      }
    `,
    {
      variables: { email },
    }
  );

  const userId = data?.user_id_by_email[0]?.id;

  return { userId, loading, error };
}

function CopyUrl({ recordingId }) {
  const [copyClicked, setCopyClicked] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`https://replay.io/view?id=${recordingId}`);
    setCopyClicked(true);
    setTimeout(() => setCopyClicked(false), 2000);
  };

  if (copyClicked) {
    return (
      <div className="copy-link">
        <div className="status">
          <div className="success">Link copied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="copy-link">
      <input
        type="text"
        value={`https://replay.io/view?id=${recordingId}`}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
      />
      <button onClick={handleCopyClick}>
        <div className="img link" />
        <div className="label">Copy Link</div>
      </button>
    </div>
  );
}

function Privacy({ isPrivate, recordingId }) {
  const updateIsPrivate = hooks.useUpdateIsPrivate(recordingId, isPrivate);

  return (
    <div className="privacy-toggle" onClick={updateIsPrivate}>
      <div className={`icon img ${isPrivate ? "locked" : "unlocked"}`} />
      {isPrivate ? (
        <div className="label">
          <div className="label-title">Private</div>
          <div className="label-description">Only you and your collaborators can view</div>
        </div>
      ) : (
        <div className="label">
          <div className="label-title">Public</div>
          <div className="label-description">Anyone with this link can view</div>
        </div>
      )}
      <button className={`toggle ${isPrivate ? "off" : "on"}`}>
        <div className="switch" />
      </button>
    </div>
  );
}

function PrivacyNote({ isPrivate, isOwner }) {
  if (!isOwner) {
    return null;
  }

  return (
    <div className={`row privacy-note ${isPrivate ? "is-private" : "is-public"}`}>
      <div style={{ width: "67px" }} />
      <div className="label">
        <div className="label-title">Note</div>
        <div className="label-description">
          Replay records everything including passwords you&#39;ve typed and sensitive data
          you&#39;re viewing.{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.notion.so/replayio/Security-2af70ebdfb1c47e5b9246f25ca377ef2"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}

function Permission({ user, role, recordingId }) {
  const [deleteCollaborator, { error }] = useMutation(DELETE_COLLABORATOR, {
    refetchQueries: ["GetOwnerAndCollaborators"],
  });
  const handleDeleteClick = () => {
    deleteCollaborator({ variables: { recordingId, userId: user.id } });
  };
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  if (error) {
    setTimeout(() => setShowErrorMessage(false), 2000);
    return <div className="permission">Could not delete this collaborator</div>;
  }

  return (
    <div className="permission">
      <div className="icon" style={{ backgroundImage: `url(${user.picture})` }} />
      <div className="main">
        <div className="name">{user.name}</div>
        <div className="email">{user.email}</div>
      </div>
      <div className="role">{role}</div>
      {role === "collaborator" ? (
        <button className="delete" onClick={handleDeleteClick}>
          <div className="img close" />
        </button>
      ) : null}
    </div>
  );
}

function PermissionsList({ recording, collaborators, recordingId }) {
  const owner = recording.user;

  return (
    <div className="permissions-list">
      <Permission user={owner} role={"owner"} />
      {collaborators
        ? collaborators.map((collaborator, i) => (
            <Permission
              user={collaborator.user}
              role={"collaborator"}
              key={i}
              recordingId={recordingId}
            />
          ))
        : null}
    </div>
  );
}

function Fetcher({ setStatus, email }) {
  const { userId, loading, error } = useFetchCollaborateorId(email);

  useEffect(() => {
    if (!loading) {
      setStatus({ type: "fetched-user", userId, error });
    }
  });

  return <div className="row status">{loading ? "Fetching" : "Fetched"}</div>;
}

function Submitter({ setStatus, userId, recordingId }) {
  const [addNewCollaborator, { loading, error }] = useMutation(ADD_COLLABORATOR, {
    refetchQueries: ["GetOwnerAndCollaborators"],
  });

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

function EmailForm({ recordingId }) {
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState({ type: "input" });

  const handleSubmit = e => {
    e.preventDefault();
    setStatus({ type: "submitted-email" });
  };
  const ErrorHandler = ({ message }) => {
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

function Sharing({ hideModal, modalOptions }) {
  const { recordingId } = modalOptions;
  const { collaborators, recording, loading: usersLoading } = hooks.useGetOwnersAndCollaborators(
    recordingId
  );
  const { isPrivate, loading: isPrivateLoading } = hooks.useGetIsPrivate(recordingId);

  if (usersLoading || isPrivateLoading) {
    return <Modal />;
  } else if (!recording) {
    setTimeout(() => hideModal(), 2000);
    return (
      <Modal>
        <div className="row status">Can&apos;t fetch your sharing permissions at this time</div>
      </Modal>
    );
  }

  return (
    <Modal>
      <div className="row title">
        <div className="img invite" />
        <p>Sharing</p>
      </div>
      <CopyUrl recordingId={recordingId} />
      <Privacy isPrivate={isPrivate} recordingId={recordingId} />
      <PrivacyNote isPrivate={isPrivate} />
      <EmailForm recordingId={recordingId} />
      <PermissionsList
        recording={recording}
        collaborators={collaborators}
        recordingId={recordingId}
      />
      <div className="bottom">
        <div className="spacer" />
        <button className="done" onClick={hideModal}>
          <div className="content">Done</div>
        </button>
      </div>
    </Modal>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
    modalOptions: selectors.getModalOptions(state),
  }),
  { hideModal: actions.hideModal }
)(Sharing);

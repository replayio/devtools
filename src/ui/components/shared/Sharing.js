import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { gql, useQuery, useMutation } from "@apollo/client";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Modal from "./Modal";
import Loader from "./Loader";
import { features } from "ui/utils/prefs";

import "./Sharing.css";

const GET_OWNER_AND_COLLABORATORS = gql`
  query MyQuery($recordingId: uuid) {
    collaborators(where: { recording_id: { _eq: $recordingId } }) {
      user {
        auth_id
        email
        id
        name
        nickname
        picture
      }
      user_id
      recording_id
    }
    recordings(where: { id: { _eq: $recordingId } }) {
      user {
        auth_id
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

const UPDATE_IS_PRIVATE = gql`
  mutation SetRecordingIsPrivate($recordingId: String, $isPrivate: Boolean) {
    update_recordings(
      where: { recording_id: { _eq: $recordingId } }
      _set: { is_private: $isPrivate }
    ) {
      returning {
        is_private
        id
      }
    }
  }
`;

const GET_COLLABORATOR_ID = gql`
  query GetCollaboratorId($email: String = "") {
    users(where: { email: { _eq: $email } }) {
      id
      email
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

function Privacy({ isPrivate, toggleIsPrivate }) {
  return (
    <div className="privacy" onClick={toggleIsPrivate}>
      {isPrivate ? (
        <>
          <div className="img locked" />
          <span>Private: Only you and collaborators can view this recording</span>
        </>
      ) : (
        <>
          <div className="img unlocked" />
          <span>Public: Everybody with this link can view this recording</span>
        </>
      )}
    </div>
  );
}

function Permission({ user, role, recordingId, refetch }) {
  const [deleteCollaborator, { called, loading, error }] = useMutation(DELETE_COLLABORATOR);
  const options = { variables: { recordingId, userId: user.id } };
  const handleDeleteClick = () => {
    deleteCollaborator(options);
    refetch();
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
      <div className="role" onClick={role == "collaborator" ? handleDeleteClick : () => {}}>
        {role}
      </div>
    </div>
  );
}

function PermissionsList({ data, recordingId, refetch }) {
  const owner = data.recordings[0].user;
  const collaborators = data.collaborators;

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
              refetch={refetch}
            />
          ))
        : null}
    </div>
  );
}

function MutationStatus({ owner, inputValue, recordingId, setInProgress, setInputValue, refetch }) {
  const { data, loading, error } = useQuery(GET_COLLABORATOR_ID, {
    variables: { email: inputValue },
  });
  const [
    addNewCollaborator,
    { called: mutationCalled, loading: mutationLoading, error: mutationError },
  ] = useMutation(ADD_COLLABORATOR);

  useEffect(() => {
    // Upon succesfully adding a collaborator, this component dismounts itself.
    if (mutationCalled && !mutationLoading && !mutationError) {
      setInputValue("");
      refetch();
      setInProgress(false);
    }
  });

  if (inputValue === owner.email) {
    setTimeout(() => setInProgress(false), 2000);
    setInputValue("");
    return <div className="status error">You can not add yourself as a collaborator.</div>;
  } else if (error) {
    setTimeout(() => setInProgress(false), 2000);
    return (
      <div className="status error">We can not fetch that collaborator right now. Try again.</div>
    );
  } else if (mutationError) {
    setTimeout(() => setInProgress(false), 2000);
    return (
      <div className="status error">We can not add that collaborator right now. Try again.</div>
    );
  } else if (!loading && data.users.length === 0) {
    setTimeout(() => setInProgress(false), 2000);
    return <div className="status error">That e-mail address is not a valid Replay user.</div>;
  }

  if (!loading && !mutationCalled) {
    const userId = data.users[0].id;
    addNewCollaborator({
      variables: { objects: [{ recording_id: recordingId, user_id: userId }] },
    });
  }

  return (
    <div className="status">
      <div className="img refresh" />
      <span className="content">Adding...</span>
    </div>
  );
}

function NewCollaboratorForm({ data, recordingId, refetch }) {
  const [inputValue, setInputValue] = useState("");
  const [inProgress, setInProgress] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    setInProgress(true);
  };

  if (inProgress) {
    return (
      <MutationStatus
        owner={data.recordings[0].user}
        inputValue={inputValue}
        recordingId={recordingId}
        setInProgress={setInProgress}
        setInputValue={setInputValue}
        refetch={refetch}
      />
    );
  }

  return (
    <form>
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

function Sharing({ modal, hideModal }) {
  const { data, loading, error, refetch } = useQuery(GET_OWNER_AND_COLLABORATORS, {
    variables: { recordingId: modal.recordingId },
  });
  const [updateIsPrivate] = useMutation(UPDATE_IS_PRIVATE);

  const toggleIsPrivate = () => {
    updateIsPrivate({
      variables: {
        recordingId: data.recordings[0].recording_id,
        isPrivate: !data.recordings[0].is_private,
      },
    });
  };

  if (loading) {
    return (
      <Modal opaque={modal.opaque}>
        <Loader />
      </Modal>
    );
  } else if (error || data.recordings.length !== 1 || !data.recordings[0].user) {
    setTimeout(() => hideModal(), 2000);
    return (
      <Modal opaque={modal.opaque}>
        <p>Can&apos;t fetch your sharing permissions at this time</p>
      </Modal>
    );
  }

  return (
    <Modal opaque={modal.opaque}>
      <button className="close-modal" onClick={hideModal}>
        <div className="img close" />
      </button>
      <h2>Share this recording with others</h2>
      <NewCollaboratorForm data={data} recordingId={modal.recordingId} refetch={refetch} />
      <PermissionsList data={data} recordingId={modal.recordingId} refetch={refetch} />
      <div className="buttons">
        <button className="done" onClick={hideModal}>
          <div className="content">Done</div>
        </button>
      </div>
      {/* {features.private ? (
        <div className="permissions tip" onClick={toggleIsPrivate}>
          {data.recordings[0].is_private
            ? "Private: Only you and collaborators can view this recording"
            : "Public: Everybody with this link can view this recording"}
        </div>
      ) : null} */}
      <Privacy isPrivate={data.recordings[0].is_private} toggleIsPrivate={toggleIsPrivate} />
    </Modal>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  { hideModal: actions.hideModal }
)(Sharing);

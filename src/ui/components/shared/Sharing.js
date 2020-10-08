import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { gql, useLazyQuery, useQuery, useMutation } from "@apollo/client";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Modal from "./Modal";
import Loader from "./Loader";
import { features } from "ui/utils/prefs";

import "./Sharing.css";
import { bindActionCreators } from "redux";

// This is a contrived demo since I don't have a new recording to experiment with. Once
// the Hasura table and dispatcher are synced again, I should:

// 1) GET_O_AND_C should take just one argument $recording_id: uuid
// 2) We should only match the recording_id, and not the id in the GOAC collaborators args
// 3) Remove the fakeRecordingId that we pass down from the SharingModal component

// TODOS
// Add a way to merge and update the cache upon deletion
// Trigger a refetch of collaborators upon mutation
// Take out the sharingmodal logic and styles from modal and reuse it somehow with userprompt
// Figure out what the unified userprompt/modal would look like

const GET_OWNER_AND_COLLABORATORS = gql`
  query GetOwnerAndCollaborators($idUuid: uuid, $idString: String) {
    collaborators(
      where: {
        recording: { recording_id: { _eq: $idString }, _or: { recording_id: { _eq: $idString } } }
      }
    ) {
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
    recordings(where: { recording_id: { _eq: $idString } }) {
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

// Older recordings have a different recordingId vs id. For, Newer recordings it's the same.
// The id search param is the same as a recording's recording_id field. The recording's id field
// has usually been different from that recording_id, so older recordings have two separate values
// for id and recording_id. However, newer recordings have the same recording_id and id. To guard
// against an invalid recording id query, we just match the recording's recording_id field.

// const GET_OWNER_AND_COLLABORATORS = gql`
//   query MyQuery($recordingId: uuid) {
//     collaborators(where: { recording_id: { _eq: $recordingId } }) {
//       user {
//         auth_id
//         email
//         id
//         name
//         nickname
//         picture
//       }
//       user_id
//       recording_id
//     }
//     recordings(where: { id: { _eq: $recordingId } }) {
//       user {
//         auth_id
//         email
//         id
//         name
//         nickname
//         picture
//       }
//       id
//     }
//   }
// `;

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

function Permission({ user, role, recordingId }) {
  const [deleteCollaborator, { called, loading, error }] = useMutation(DELETE_COLLABORATOR);
  const options = { variables: { recordingId, userId: user.id } };
  const handleDeleteClick = () => {
    deleteCollaborator(options);
  };
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  if (error) {
    // Error state: Show the error message for 2s, then re-render the original permission.
    setTimeout(() => setShowErrorMessage(false), 2000);
    return <div className="permission">Could not delete this collaborator</div>;
  }

  console.log(">>delete options", options);
  console.log(called, loading, error);

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

function PermissionsList({ data, recordingId }) {
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
            />
          ))
        : null}
    </div>
  );
}

function NewCollaboratorInput({ data, recordingId }) {
  const [inputValue, setInputValue] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    setShowSpinner(true);
  };

  return (
    <form>
      {showSpinner ? (
        <MutationLoader
          owner={data.recordings[0].user}
          inputValue={inputValue}
          recordingId={recordingId}
          setShowSpinner={setShowSpinner}
          setInputValue={setInputValue}
        />
      ) : (
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Add a collaborator"
        />
      )}
      <input type="submit" onClick={handleSubmit} value={"Add"} />
    </form>
  );
}

function MutationLoader({ owner, inputValue, recordingId, setShowSpinner, setInputValue }) {
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
      setShowSpinner(false);
    }
  });

  if (inputValue === owner.email) {
    setTimeout(() => setShowSpinner(false), 2000);
    setInputValue("");
    return <div className="spinner">ERROR: You can not add yourself as a collaborator.</div>;
  } else if (error) {
    setTimeout(() => setShowSpinner(false), 2000);
    return (
      <div className="spinner">ERROR: We can not fetch that collaborator right now. Try again.</div>
    );
  } else if (mutationError) {
    setTimeout(() => setShowSpinner(false), 2000);
    return (
      <div className="spinner">ERROR: We can not add that collaborator right now. Try again.</div>
    );
  } else if (!loading && data.users.length === 0) {
    setTimeout(() => setShowSpinner(false), 2000);
    return <div className="spinner">ERROR: That e-mail address is not a valid Replay user.</div>;
  }

  if (!loading && !mutationCalled) {
    const userId = data.users[0].id;
    addNewCollaborator({
      variables: { objects: [{ recording_id: recordingId, user_id: userId }] },
    });
  }

  return (
    <div className="spinner">
      <div className="img refresh" />
      <span className="content">Adding...</span>
    </div>
  );
}

function Sharing({ modal, hideModal }) {
  const { data, loading, error } = useQuery(GET_OWNER_AND_COLLABORATORS, {
    variables: { idUuid: modal.recordingId, idString: modal.recordingId },
    pollInterval: 1000,
  });
  const [updateIsPrivate] = useMutation(UPDATE_IS_PRIVATE);
  const fakeRecordingId = "afb1e1de-721c-44e8-929c-6a1798617618"; // use a fake id here since recording_id != id for old recordings

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
    // Error state: Show the error message for 2s, then dismount SharingModal.
    setTimeout(() => hideModal(), 2000);
    return (
      <Modal opaque={modal.opaque}>
        <p>Can&apos;t fetch your sharing permissions at this time</p>
      </Modal>
    );
  }

  return (
    <Modal opaque={modal.opaque}>
      <button className="close-modal" onClick={hideModal}>X</button>
      <h2>Share this recording with others</h2>
      <NewCollaboratorInput data={data} recordingId={modal.recordingId} />
      <PermissionsList data={data} recordingId={modal.recordingId} />
      <div className="buttons">
        <button className="done" onClick={hideModal}>
          <div className="content">Done</div>
        </button>
      </div>
      {features.private ? (
        <div className="permissions tip" onClick={toggleIsPrivate}>
          {data.recordings[0].is_private
            ? "Private: Only you and collaborators can view this recording"
            : "Public: Everybody with this link can view this recording"}
        </div>
      ) : null}
    </Modal>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  { hideModal: actions.hideModal }
)(Sharing);

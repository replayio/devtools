import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import { gql, useLazyQuery, useQuery, useMutation } from "@apollo/client";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

import Loader from "./Loader";

import "./Modal.css";
import { bindActionCreators } from "redux";

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
    }
  }
`;

const GET_COLLABORATOR_ID = gql`
  query MyQuery($email: String = "") {
    users(where: { email: { _eq: $email } }) {
      id
      email
    }
  }
`;

const ADD_COLLABORATOR = gql`
  mutation MyMutation($objects: [collaborators_insert_input!]! = {}) {
    insert_collaborators(objects: $objects) {
      affected_rows
    }
  }
`;

const DELETE_COLLABORATOR = gql`
  mutation MyMutation($recordingId: uuid, $userId: uuid) {
    delete_collaborators(
      where: { _and: { recording_id: { _eq: $recordingId } }, user_id: { _eq: $userId } }
    ) {
      affected_rows
    }
  }
`;

function Permission({ classname, name, email, role, picture, id, recordingId }) {
  const [deleteCollaborator, { called, loading, error }] = useMutation(DELETE_COLLABORATOR);
  const options = { variables: { recordingId: recordingId, userId: id } };
  const handleDeleteClick = () => {
    deleteCollaborator(options);
  };

  console.log(options);
  console.log(called, loading, error);

  return (
    <div className="permission">
      <div className="icon" style={{ backgroundImage: `url(${picture})` }} />
      <div className="main">
        <div className="name">{name}</div>
        <div className="email">{email}</div>
      </div>
      <div className="role" onClick={handleDeleteClick}>
        {role}
      </div>
    </div>
  );
}

function PermissionsList({ data, recordingId }) {
  const owner = data.recordings[0].user;
  const collaborators = data.collaborators;
  console.log(collaborators);

  return (
    <div className="permissions-list">
      <Permission name={owner.nickname} email={owner.email} role={"owner"} />
      {collaborators
        ? collaborators.map((collaborator, i) => (
            <Permission
              name={collaborator.user.name}
              email={collaborator.user.email}
              role={"collaborator"}
              picture={collaborator.user.picture}
              key={i}
              id={collaborator.user.id}
              recordingId={recordingId}
            />
          ))
        : null}
    </div>
  );
}

function NewCollaboratorForm({ added, setAdded, recordingId }) {
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

function MutationLoader({ inputValue, recordingId, setShowSpinner, setInputValue }) {
  const { data, loading, error } = useQuery(GET_COLLABORATOR_ID, {
    variables: { email: inputValue },
  });
  const [
    addNewCollaborator,
    { called: mutationCalled, loading: mutationLoading, error: mutationError },
  ] = useMutation(ADD_COLLABORATOR);

  if (!loading && !mutationCalled) {
    const userId = data.users[0].id;
    addNewCollaborator({
      variables: { objects: [{ recording_id: recordingId, user_id: userId }] },
    });
  }

  useEffect(() => {
    if (mutationCalled && !mutationLoading && !mutationError) {
      setInputValue("");
      setShowSpinner(false);
    }
  });

  return (
    <div className="spinner">
      <div className="img refresh" />
      <span className="content">Adding...</span>
    </div>
  );
}

function Modal({ modal, hideModal }) {
  const [added, setAdded] = useState(true);
  const { data, loading, error } = useQuery(GET_OWNER_AND_COLLABORATORS, {
    variables: { recordingId: modal.recordingId },
    pollInterval: 1000,
  });

  if (loading) {
    return (
      <div className={classnames("modal-container", { mask: modal.mask })}>
        <div className={classnames("modal")}>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className={classnames("modal-container", { mask: modal.mask })}>
      <div className={classnames("modal")}>
        <button className="close-modal" onClick={hideModal}>X</button>
        <h2>Share this recording with others</h2>
        <NewCollaboratorForm added={added} setAdded={setAdded} recordingId={modal.recordingId} />
        <PermissionsList data={data} recordingId={modal.recordingId} />
        <div className="buttons">
          <button className="done" onClick={hideModal}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
  }),
  { hideModal: actions.hideModal }
)(Modal);

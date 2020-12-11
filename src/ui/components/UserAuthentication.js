import { gql, useMutation } from "@apollo/client";
import { connect } from "react-redux";
import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import { setUserInBrowserPrefs } from "ui/utils/browser";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

const CREATE_SESSION = gql`
  mutation CreateSession($object: sessions_insert_input!) {
    insert_sessions_one(object: $object) {
      id
      controller_id
      recording_id
    }
  }
`;

export function UserAuthentication({ sessionId, recordingId, updateUser }) {
  const [CreateSession] = useMutation(CREATE_SESSION);
  const auth = useAuth0();

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
    updateUser(auth.user);
  }, [auth.user]);

  useEffect(() => {
    if (auth.user && sessionId) {
      const object = {
        id: sessionId,
        recording_id: recordingId,
        controller_id: sessionId.split("/")[0],
      };
      CreateSession({ variables: { object } });
    }
  }, [auth.user, sessionId]);

  return null;
}

export default connect(
  state => ({
    sessionId: selectors.getSessionId(state),
    recordingId: selectors.getRecordingId(state),
  }),
  {
    updateUser: actions.updateUser,
  }
)(UserAuthentication);

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import { Recording } from "./Recording";
import { useAuth0 } from "@auth0/auth0-react";
import { sortBy } from "lodash";
import { gql, useQuery, useMutation } from "@apollo/client";
import Loader from "../shared/Loader.js";

import "./Recordings.css";

const RECORDINGS = gql`
  query MyRecordingsQuery($authId: String) {
    recordings(where: { user: { auth_id: { _eq: $authId } } }) {
      id
      url
      title
      recording_id
      recordingTitle
      last_screen_mime_type
      duration
      description
      date
      last_screen_data
      user {
        auth_id
      }
      is_private
    }
  }
`;

const DELETE_RECORDING = gql`
  mutation DeleteRecording($recordingId: String) {
    delete_recordings(where: { recording_id: { _eq: $recordingId } }) {
      returning {
        id
      }
    }
  }
`;

const Recordings = props => {
  const { user } = useAuth0();
  const { data, loading, refetch } = useQuery(RECORDINGS, {
    variables: { authId: user.sub },
  });
  const [deleteRecording] = useMutation(DELETE_RECORDING);

  if (loading) {
    return <Loader />;
  }

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId } });
    refetch();
  };

  const sortedRecordings = sortBy(data.recordings, recording => -new Date(recording.date));

  return (
    <div className="recordings">
      {sortedRecordings &&
        sortedRecordings.map((recording, i) => (
          <Recording data={recording} key={i} onDeleteRecording={onDeleteRecording} />
        ))}
    </div>
  );
};

export default Recordings;

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
  query MyRecordingsQuery {
    recordings {
      id
      url
      title
      recording_id
      recordingTitle
      last_screen_mime_type
      duration
      description
      date
      user_id
      last_screen_data
    }
  }
`;

const DELETE_RECORDING = gql`
  mutation DeleteRecording($id: uuid) {
    delete_recordings(where: { id: { _eq: $id } }) {
      returning {
        id
      }
    }
  }
`;

const Recordings = props => {
  const { data, loading, refetch } = useQuery(RECORDINGS);
  const [deleteRecording] = useMutation(DELETE_RECORDING);

  if (loading) {
    return <Loader />;
  }

  const onDeleteRecording = async id => {
    await deleteRecording({ variables: { id } });
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

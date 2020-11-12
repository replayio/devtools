import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import Recording from "./Recording";
import { useAuth0 } from "@auth0/auth0-react";
import { sortBy } from "lodash";
import { gql, useQuery, useMutation } from "@apollo/client";
import LeftSidebar from "./LeftSidebar";

import "./Recordings.css";

const GET_MY_RECORDINGS = gql`
  query GetMyRecordings($authId: String) {
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
  const [filter, setFilter] = useState("");
  const { data } = useQuery(GET_MY_RECORDINGS, {
    variables: { authId: user.sub },
  });
  const [deleteRecording] = useMutation(DELETE_RECORDING, {
    refetchQueries: ["GetMyRecordings"],
  });

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId } });
  };

  const visibleRecordings = [...data.recordings].filter(recording =>
    recording.url.includes(filter)
  );
  const sortedRecordings = sortBy(visibleRecordings, recording => -new Date(recording.date));

  return (
    <main className="recordings">
      <LeftSidebar recordings={data.recordings} setFilter={setFilter} filter={filter} />
      <div className="recordings-list-container">
        <div className="recordings-list">
          {sortedRecordings &&
            sortedRecordings.map((recording, i) => (
              <Recording data={recording} key={i} onDeleteRecording={onDeleteRecording} />
            ))}
        </div>
      </div>
    </main>
  );
};

export default Recordings;

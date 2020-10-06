import React, { useState } from "react";
import { Recording } from "./Recording";
import { sortBy } from "lodash";
import { gql, useQuery, useMutation } from "@apollo/client";
import Loader from "../shared/Loader.js";

import "./Recordings.css";

const RECORDINGS = gql`
  query MyRecordingsQuery {
    recordings(limit: 10) {
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
  mutation DeleteRecording($recordingId: String) {
    delete_recordings(where: { recording_id: { _eq: $recordingId } }) {
      returning {
        id
      }
    }
  }
`;

const DELETE_RECORDINGS = gql`
  mutation DeleteRecording($recordingIds: [String!]) {
    delete_recordings(where: { recording_id: { _in: $recordingIds } }) {
      returning {
        id
      }
    }
  }
`;

function useRecordingSelectList() {
  const [selectedSet, setList] = useState(new Set());
  const toggleRecording = recordingId => {
    if (selectedSet.has(recordingId)) {
      selectedSet.delete(recordingId);
    } else {
      selectedSet.add(recordingId);
    }
    return setList(new Set(selectedSet));
  };

  const clearRecordings = () => setList(new Set());

  const selectedList = [...selectedSet];
  return { selectedList, toggleRecording, clearRecordings };
}

const Recordings = () => {
  const { data, loading, refetch } = useQuery(RECORDINGS);
  const [deleteRecording] = useMutation(DELETE_RECORDING);
  const [deleteRecordings] = useMutation(DELETE_RECORDINGS);
  const { selectedList, toggleRecording, clearRecordings } = useRecordingSelectList();

  console.log(selectedList);
  if (loading) {
    return <Loader />;
  }

  const onDeleteRecording = async recordingId => {
    await deleteRecording({ variables: { recordingId } });
    refetch();
  };

  const onDeleteRecordings = async () => {
    deleteRecordings({ recordingIds: selectedList });
    clearRecordings();
    refetch();
  };

  window.recordings = data.recordings;
  const sortedRecordings = sortBy(data.recordings, recording => -new Date(recording.date));

  return (
    <div>
      <div className="actions">
        <a href="#" onClick={onDeleteRecordings}>
          Delete Recordings
        </a>
      </div>
      <div className="recordings">
        {sortedRecordings &&
          sortedRecordings.map((recording, i) => (
            <Recording
              data={recording}
              key={i}
              toggleRecording={toggleRecording}
              onDeleteRecording={onDeleteRecording}
            />
          ))}
      </div>
    </div>
  );
};

export default Recordings;

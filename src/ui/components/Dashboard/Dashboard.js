import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { gql, useQuery } from "@apollo/client";
import DashboardNavigation from "./DashboardNavigation";
import DashboardViewer from "./DashboardViewer";
import "./Dashboard.css";

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

const Dashboard = props => {
  const { user } = useAuth0();
  const [filter, setFilter] = useState("");
  const { data } = useQuery(GET_MY_RECORDINGS, {
    variables: { authId: user.sub },
  });

  const filteredRecordings = [...data.recordings].filter(recording =>
    recording.url.includes(filter)
  );

  return (
    <main className="dashboard">
      <DashboardNavigation recordings={data.recordings} setFilter={setFilter} filter={filter} />
      <DashboardViewer recordings={filteredRecordings} filter={filter} />
    </main>
  );
};

export default Dashboard;

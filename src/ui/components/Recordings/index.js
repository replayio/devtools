import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { selectors } from "../../reducers";
import { Recording } from "./Recording";
import { useAuth0 } from "@auth0/auth0-react";
import Lottie from "react-lottie";
import forwardData from "image/lottie/forward.json";
import { sortBy } from "lodash";
import { gql, useQuery, useApolloClient } from "@apollo/client";

import "./Recordings.css";

function Forward() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: forwardData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return <Lottie options={defaultOptions} height={50} width={200} />;
}

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

const Recordings = props => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const [recordings, setRecordings] = useState(null);
  const apolloClient = useApolloClient();

  useEffect(() => {
    async function getResults() {
      const client = await apolloClient;

      // Our ApolloClient is created asynchronously. If that client is not yet
      // ready, we should bail.
      if (client) {
        // We intentionally don't use Apollo's useQuery method here. UseQuery is
        // a hook, and making a hook run conditionally is a big React no-no
        // (Rules of Hooks). Instead, we extract the query logic from the useQuery
        // hook and just call it here directly.
        const response = await client.query({ query: RECORDINGS });
        setRecordings(response.data.recordings);
      }
    }

    getResults();
  });

  if (isLoading || (isAuthenticated && recordings === null)) {
    return (
      <div className="loading-pane">
        <Forward />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="welcome-screen">
        <div className="welcome-panel">
          <img className="logo" src="images/logo.svg" />
          <img className="atwork" src="images/computer-work.svg" />
          <button onClick={() => loginWithRedirect()}>Log In</button>
        </div>
      </div>
    );
  }

  const sortedRecordings = sortBy(recordings, recording => -new Date(recording.date));

  return (
    <div className="recordings">
      {sortedRecordings &&
        sortedRecordings.map((recording, i) => <Recording data={recording} key={i} />)}
    </div>
  );
};

export default Recordings;

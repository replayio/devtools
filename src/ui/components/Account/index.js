import React, { useEffect } from "react";
import { connect } from "react-redux";
import Recordings from "../Recordings/index";
import { useAuth0 } from "@auth0/auth0-react";
import Header from "../Header/index";
import Loader from "../shared/Loader";
import Prompt from "../shared/Prompt";
import { gql, useQuery } from "@apollo/client";
import { setUserInBrowserPrefs } from "../../utils/browser";

import "./Account.css";

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

function FirstRecordingPrompt() {
  return (
    <div className="first-recording-prompt">
      <Prompt>
        <h1>Your First Recording</h1>
        <p>
          You don&apos;t have any recordings yet, so we&apos;ll walk you through your first one.
        </p>
        <ol>
          <li>Open a new tab</li>
          <li>Navigate to the URL you would like to record</li>
          <li>Click on the Record button</li>
          <li>
            When you&apos;re done recording, click on the Record button again to stop and save
          </li>
        </ol>
        <p>
          Once saved, the tab will automatically redirect you to that recording. The recording is
          just a link which you are free to revisit by yourself or share with others. You can also
          access any past recordings here in your <a href="https://replay.io/view">account</a>.
        </p>
        <hr />
        <img src="images/record-screenshot.png" style={{ width: "80%" }} />
        <p className="tip">The record button can be found to the right of the URL bar.</p>
      </Prompt>
    </div>
  );
}

function AccountPage() {
  const { user } = useAuth0();
  const { data, error, loading } = useQuery(GET_MY_RECORDINGS, {
    variables: { authId: user.sub },
    pollInterval: 10000,
  });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
    throw new Error(error);
  }

  if (data.recordings && !data.recordings.length) {
    return <FirstRecordingPrompt />;
  }

  return <Recordings />;
}

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-panel">
        <img className="logo" src="images/logo.svg" />
        <img className="atwork" src="images/computer-work.svg" />
        <button onClick={() => loginWithRedirect()}>Sign In</button>
      </div>
    </div>
  );
}

export default function Account() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  return (
    <>
      <Header />
      <AccountPage />
    </>
  );
}

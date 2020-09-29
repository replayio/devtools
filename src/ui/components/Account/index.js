import React, { useEffect, useState } from "react";
import Recordings from "../Recordings/index";
import { useAuth0 } from "@auth0/auth0-react";
import Header from "../Header";
import Loader from "../shared/Loader";
import { gql, useQuery } from "@apollo/client";
import classnames from "classnames";
import { setUserInBrowserPrefs } from "../../utils/browser";

import "./Account.css";

const RECORDINGS = gql`
  query MyRecordingsQuery {
    recordings {
      id
    }
  }
`;

export function UserPrompt({ children }) {
  return <div className="user-prompt">{children}</div>;
}

function FirstRecordingPrompt() {
  return (
    <UserPrompt>
      <h1>Your First Recording</h1>
      <p>You don&apos;t have any recordings yet, so we&apos;ll walk you through your first one.</p>
      <ol>
        <li>Open a new tab</li>
        <li>Navigate to the URL you would like to record</li>
        <li>Click on the Record button</li>
        <li>When you&apos;re done recording, click on the Record button again to stop and save</li>
      </ol>
      <p>
        Once saved, the tab will automatically redirect you to that recording. The recording is just
        a link which you are free to revisit by yourself or share with others. You can also access
        any past recordings here in your <a href="https://replay.io/view">account</a>.
      </p>
      <hr />
      <img
        src="https://user-images.githubusercontent.com/15959269/94066534-98f29300-fdba-11ea-96c8-0fd5851d53d3.png"
        style={{ width: "80%" }}
      />
      <p className="tip">The record button can be found to the left of the URL bar.</p>
    </UserPrompt>
  );
}

function AccountPage() {
  const { data, loading } = useQuery(RECORDINGS, { pollInterval: 10000 });

  if (loading) {
    return <Loader />;
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
        <button onClick={() => loginWithRedirect()}>Log In</button>
      </div>
    </div>
  );
}

export function Account() {
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

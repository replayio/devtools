import React, { useEffect } from "react";
import Recordings from "./Recordings/index";
import { useAuth0 } from "@auth0/auth0-react";
import Header from "./Header";

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();

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

function FirstRecording() {
  return (
    <div>
      <h2>Your First Recording</h2>
      <p>You don’t have any recordings yet. Try recording our version of TodoMVC below.</p>
      <form>
        <input type="textarea"></input>
        <input type="submit">Start Recording</input>
      </form>
    </div>
  );
}

function AccountPage() {
  const { data, loading } = useQuery(RECORDINGS);

  if (data.recordings && !data.recordings.length) {
    return <FirstRecording />
  }

  return <Recordings />;
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

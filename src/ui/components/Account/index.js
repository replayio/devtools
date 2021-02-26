import React, { useEffect } from "react";
import Dashboard from "../Dashboard/index";
import { useAuth0 } from "@auth0/auth0-react";
import useToken from "ui/utils/useToken";
import Loader from "../shared/Loader";
import { gql, useQuery } from "@apollo/client";
import { setUserInBrowserPrefs } from "../../utils/browser";
import UserOptions from "ui/components/Header/UserOptions";

import "./Account.css";

const GET_MY_RECORDINGS = gql`
  fragment recordingFields on recordings {
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

  fragment avatarFields on users {
    name
    email
    picture
    id
  }

  query GetMyRecordings($userId: uuid) {
    users(where: { id: { _eq: $userId } }) {
      ...avatarFields
      collaborators {
        recording {
          ...recordingFields
          user {
            ...avatarFields
          }
        }
      }
      recordings(where: { deleted_at: { _is_null: true } }) {
        ...recordingFields
      }
    }

    recordings(where: { example: { _eq: true } }) {
      ...recordingFields
      user {
        ...avatarFields
      }
    }
  }
`;

function getRecordings(data) {
  if (!data.users.length) {
    return [];
  }

  const user = data.users[0];
  const { recordings, collaborators, name, email, picture, auth_id } = user;

  return [
    ...recordings.map(recording => ({ ...recording, user: { name, email, picture, auth_id } })),
    ...collaborators.map(({ recording }) => recording),
    ...data.recordings,
  ];
}

function AccountPage() {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;
  const { data, error, loading } = useQuery(GET_MY_RECORDINGS, {
    variables: { userId },
    pollInterval: 10000,
  });

  if (loading) {
    return <Loader />;
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
    throw new Error(error);
  }

  const recordings = getRecordings(data);

  return <Dashboard recordings={recordings} />;
}

function WelcomePage() {
  const { loginWithRedirect } = useAuth0();
  const forceOpenAuth = new URLSearchParams(window.location.search).get("signin");

  if (forceOpenAuth) {
    loginWithRedirect();
    return null;
  }

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

function AccountHeader() {
  return (
    <div id="header">
      <div className="header-left">
        <div className="logo" />
        <div className="title-label">Replay</div>
      </div>
      <UserOptions mode="account" />
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
      <AccountHeader />
      <AccountPage />
    </>
  );
}

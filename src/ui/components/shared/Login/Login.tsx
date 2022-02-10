import { gql } from "@apollo/client";
import React, { FC, useEffect, useState } from "react";

import { query } from "ui/utils/apolloClient";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { isTeamMemberInvite } from "ui/utils/onboarding";
import useAuth0 from "ui/utils/useAuth0";

import { PrimaryLgButton } from "../Button";
import { OnboardingContentWrapper, OnboardingModalContainer } from "../Onboarding";

const GET_CONNECTION = gql`
  query GetConnection($email: String!) {
    auth {
      connection(email: $email)
    }
  }
`;

const SSOLogin: FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { loginWithRedirect } = useAuth0();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | boolean>(false);

  const onEnterpriseLogin = async (): Promise<void> => {
    const resp = await query({
      query: GET_CONNECTION,
      variables: {
        email,
      },
    });

    if (resp.data?.auth.connection) {
      loginWithRedirect({
        connection: resp.data.auth.connection,
        appState: { returnTo: window.location.pathname + window.location.search },
      });
    } else {
      setError(resp.errors?.find(e => e.message)?.message || true);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-base">
        Enter your email to be redirected to your SSO provider.
      </p>
      {error ? (
        <p className="text-center text-base text-red-500">
          {typeof error === "string"
            ? "We were unable to find your SSO provider right now. Please try again later."
            : "We couldn't find an SSO provider for your email."}
        </p>
      ) : null}
      <div className="flex flex-row space-x-3">
        <input
          type="email"
          className="flex-grow rounded-md"
          placeholder="user@company.com"
          value={email}
          onKeyPress={e => (e.key === "Enter" ? onEnterpriseLogin() : null)}
          onChange={e => setEmail(e.currentTarget.value)}
        />

        <PrimaryLgButton color="blue" onClick={onEnterpriseLogin} className="justify-center">
          Sign in
        </PrimaryLgButton>
      </div>
      <button
        className="w-full justify-center text-sm font-bold text-primaryAccent underline"
        onClick={onLogin}
      >
        Sign in with Google
      </button>
    </div>
  );
};

const SocialLogin: FC<{
  onShowSSOLogin: () => void;
  onLogin: () => void;
}> = ({ onShowSSOLogin, onLogin }) => {
  return (
    <div className="space-y-6">
      {isTeamMemberInvite() ? <h1 className="text-2xl font-extrabold">Almost there!</h1> : null}
      <div className="space-y-4 self-start text-base">
        {isTeamMemberInvite() ? (
          <p>In order to join your team, we first need you to sign in.</p>
        ) : (
          <>
            <p className="text-center">
              Replay captures everything you need for the perfect bug report, all in one link.{" "}
              <a href="https://replay.io" className="pointer-hand underline">
                Learn more
              </a>
            </p>
            <p></p>
          </>
        )}
      </div>
      <PrimaryLgButton color="blue" onClick={onLogin} className="w-full justify-center">
        Sign in with Google
      </PrimaryLgButton>
      <button
        className="w-full justify-center text-sm font-bold text-primaryAccent underline"
        onClick={onShowSSOLogin}
      >
        Enterprise Users: Sign in with SSO
      </button>
    </div>
  );
};

const Login: FC<{ returnToPath?: string }> = ({ returnToPath = "" }) => {
  const { loginWithRedirect } = useAuth0();
  const [sso, setSSO] = useState(false);

  const onLogin = (): void | Promise<void> =>
    loginWithRedirect({
      connection: "google-oauth2",
      appState: { returnTo: returnToPath },
    });

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <OnboardingModalContainer theme="light">
      <OnboardingContentWrapper overlay>
        {sso ? (
          <SSOLogin onLogin={onLogin} />
        ) : (
          <SocialLogin onShowSSOLogin={() => setSSO(true)} onLogin={onLogin} />
        )}
      </OnboardingContentWrapper>
    </OnboardingModalContainer>
  );
};

export default Login;

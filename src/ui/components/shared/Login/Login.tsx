import { gql } from "@apollo/client";
import { ExclamationIcon } from "@heroicons/react/outline";
import Services from "devtools/shared/services";
import Link from "next/link";
import React, { ReactNode, useEffect, useState } from "react";
import { getLoginReferrerParam } from "ui/utils/environment";
import { query } from "ui/utils/apolloClient";
import { requestBrowserLogin, setUserInBrowserPrefs } from "ui/utils/browser";
import { isTeamMemberInvite } from "ui/utils/onboarding";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

const isOSX = Services.appinfo.OS === "Darwin";

import { PrimaryLgButton } from "../Button";
import { OnboardingContentWrapper, OnboardingModalContainer } from "../Onboarding";

enum LoginReferrer {
  default = "default",
  firstBrowserOpen = "first-browser-open",
}

const GET_CONNECTION = gql`
  query GetConnection($email: String!) {
    auth {
      connection(email: $email)
    }
  }
`;

function SSOLogin({ onLogin }: { onLogin: () => void }) {
  const { loginWithRedirect } = useAuth0();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | boolean>(false);

  const onEnterpriseLogin = async () => {
    const resp = await query({
      query: GET_CONNECTION,
      variables: {
        email,
      },
    });

    if (resp.data?.auth.connection) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
        connection: resp.data.auth.connection,
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
          className="w-48 flex-grow rounded-md"
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
}

function LoginMessaging() {
  const referrer = getLoginReferrerParam();

  // Custom screen for when the user is seeing the login screen and this is the first
  // time that they have opened the browser.
  if (referrer === LoginReferrer.firstBrowserOpen) {
    <div className="space-y-6">
      <div className="space-y-4 self-start text-base">
        <div className="text-center">
          <p>Replay captures everything you need for the perfect bug report, all in one link</p>
          <a href="https://replay.io" className="pointer-hand underline">
            Learn more
          </a>
        </div>
      </div>
    </div>;
  }

  return (
    <>
      {isTeamMemberInvite() ? <h1 className="text-2xl font-extrabold">Almost there!</h1> : null}
      <div className="space-y-4 self-start text-base">
        {isTeamMemberInvite() ? (
          <p>In order to join your team, we first need you to sign in.</p>
        ) : (
          <>
            <div className="text-center">
              <p>Replay captures everything you need for the perfect bug report, all in one link</p>
              <a href="https://replay.io" className="pointer-hand underline">
                Learn more
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SocialLogin({
  onShowSSOLogin,
  onLogin,
}: {
  onShowSSOLogin: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="space-y-6">
      <LoginMessaging />
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
}

function ReplayBrowserLogin() {
  const onLogin = () => {
    requestBrowserLogin();
  };

  return (
    <div className="space-y-6">
      <LoginMessaging />
      <PrimaryLgButton color="blue" onClick={onLogin} className="w-full justify-center">
        Sign in
      </PrimaryLgButton>
    </div>
  );
}

function AuthError({ error }: { error: any }) {
  let message = error && "message" in error ? error.message : null;

  if (!message) {
    return null;
  }

  if (message === "Invalid state") {
    // This is usually caused by waiting too long to go through the auth process
    // and can be fixed by trying again.
    message = "Your login session expired. Please try logging in again.";
  } else {
    // We want to capture any other error so we can investigate further.
    sendTelemetryEvent("devtools-auth-error-login", {
      errorMessage: message,
    });

    if (message === "Unable to authenticate user") {
      // This usually occurs because our auth hook threw an error but the
      // message itself isn't very useful so we show a more friendly message
      message = "We're sorry but we had a problem authenticating you. We're looking into it now!";
    }
  }

  return (
    <OnboardingContentWrapper overlay noLogo>
      <div className="flex flex-row items-center space-x-4">
        <ExclamationIcon className="h-12 w-12 flex-shrink-0 text-red-500" />
        <span className="align-left text-base font-bold">{message}</span>
      </div>
    </OnboardingContentWrapper>
  );
}

export function LoginLink({
  children,
  referrer,
}: {
  children: ReactNode;
  referrer?: LoginReferrer;
}) {
  const href = `/${referrer ? `?login-referrer=${referrer}` : ""}`;
  return <Link href={href}>{children}</Link>;
}

export default function Login({ returnToPath = "" }: { returnToPath?: string }) {
  const { loginWithRedirect, error } = useAuth0();
  const [sso, setSSO] = useState(false);

  if (returnToPath.startsWith("/login")) {
    returnToPath = "/";
  }

  const onLogin = () =>
    loginWithRedirect({
      appState: { returnTo: returnToPath },
      connection: "google-oauth2",
    });

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <OnboardingModalContainer theme="light">
      <OnboardingContentWrapper overlay>
        {global.__IS_RECORD_REPLAY_RUNTIME__ && isOSX ? (
          <ReplayBrowserLogin />
        ) : sso ? (
          <SSOLogin onLogin={onLogin} />
        ) : (
          <SocialLogin onShowSSOLogin={() => setSSO(true)} onLogin={onLogin} />
        )}
      </OnboardingContentWrapper>
      <AuthError error={error} />
    </OnboardingModalContainer>
  );
}

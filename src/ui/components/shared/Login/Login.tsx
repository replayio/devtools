import { gql } from "@apollo/client";
import { ExclamationIcon } from "@heroicons/react/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";

import { Button } from "replay-next/components/Button";
import { query } from "shared/graphql/apolloClient";
import { GetConnection, GetConnectionVariables } from "shared/graphql/generated/GetConnection";
import { getReadOnlyParamsFromURL } from "shared/utils/environment";
import { isMacOS } from "shared/utils/os";
import { UserInfo, useGetUserInfo } from "ui/hooks/users";
import { getAuthClientId, getAuthHost } from "ui/utils/auth";
import { requestBrowserLogin, setUserInBrowserPrefs } from "ui/utils/browser";
import { isTeamMemberInvite } from "ui/utils/onboarding";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";
import useToken from "ui/utils/useToken";

import { OnboardingContentWrapper, OnboardingModalContainer } from "../Onboarding";

const isOSX = isMacOS();

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

function SSOLogin({ onLogin }: { onLogin: (connection: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | boolean>(false);

  const onEnterpriseLogin = async () => {
    const resp = await query<GetConnection, GetConnectionVariables>({
      query: GET_CONNECTION,
      variables: {
        email,
      },
    });

    if (resp.data?.auth?.connection) {
      onLogin(resp.data.auth.connection);
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
          className="w-48 flex-grow rounded-md text-black"
          placeholder="user@company.com"
          value={email}
          onKeyDown={e => (e.key === "Enter" ? onEnterpriseLogin() : null)}
          onChange={e => setEmail(e.currentTarget.value)}
        />

        <Button className="justify-center" onClick={onEnterpriseLogin} size="large">
          Sign in
        </Button>
      </div>
      <button
        className="w-full justify-center text-sm font-bold text-primaryAccent underline"
        onClick={() => onLogin("google-oauth2")}
      >
        Sign in with Google
      </button>
    </div>
  );
}

function LoginMessaging() {
  const { referrer: referrerString } = getReadOnlyParamsFromURL();
  const referrer = referrerString === "first-browser-open" ? referrerString : "default";

  // Custom screen for when the user is seeing the login screen and this is the first
  // time that they have opened the browser.
  if (referrer === LoginReferrer.firstBrowserOpen) {
    return (
      <div className="text-center text-base">
        <p>Replay captures everything you need for the perfect bug report, all in one link!</p>
        <a href="https://replay.io" className="pointer-hand underline">
          Learn more
        </a>
      </div>
    );
  }

  return (
    <>
      {isTeamMemberInvite() ? (
        <h1 className="text-center text-2xl font-extrabold">Almost there!</h1>
      ) : null}
      <div className="space-y-4 self-start text-center text-base">
        {isTeamMemberInvite() ? (
          <p>To join your team, please sign in.</p>
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

function SwitchAccountMessage({
  user,
  label,
  onSwitch,
  onCancel,
}: {
  user: UserInfo;
  label: string;
  onCancel: () => void;
  onSwitch: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-center text-base">
        You are already logged in as <strong>{user.email}</strong>.
      </p>
      <Button className="w-full justify-center" onClick={onCancel} size="large">
        {label}
      </Button>
      {global.__IS_RECORD_REPLAY_RUNTIME__ ? null : (
        <Button
          className="w-full justify-center text-sm font-bold text-primaryAccent underline"
          onClick={onSwitch}
          size="large"
          variant="outline"
        >
          Switch Accounts
        </Button>
      )}
    </div>
  );
}

function SocialLogin({
  onShowSSOLogin,
  onLogin,
}: {
  onShowSSOLogin: () => void;
  onLogin: (connection: string) => void;
}) {
  return (
    <div className="space-y-6">
      <LoginMessaging />
      <Button
        className="w-full justify-center"
        onClick={() => onLogin("google-oauth2")}
        size="large"
      >
        Sign in with Google
      </Button>
      <Button
        className="w-full justify-center text-sm font-bold text-primaryAccent underline"
        onClick={onShowSSOLogin}
        size="large"
        variant="outline"
      >
        Enterprise Users: Sign in with SSO
      </Button>
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
      <Button className="w-full justify-center" onClick={onLogin} size="large">
        Sign in
      </Button>
    </div>
  );
}

function AuthError({ error }: { error: any }) {
  let message = error && "message" in error ? error.message : null;

  if (!message) {
    return null;
  }

  // Except for the "Invalid state" message that comes from Auth0 directly
  // https://auth0.com/docs/customize/integrations/cms/wordpress-plugin/troubleshoot-wordpress-plugin-invalid-state-errors#common-causes-of-the-invalid-state-error
  // (^ Even though the document is about the WordPress plugin, the cause for the invalid state applies to any Auth0 app).
  // We define all the other "messages" in our Auth0 Rule.
  // See more here: https://auth0.com/docs/customize/rules/raise-errors-from-rules
  if (message !== "INVALID_STATE" && message !== "Invalid state") {
    // We want to capture any other error so we can investigate further.
    sendTelemetryEvent("devtools-auth-error-login", {
      errorMessage: message,
    });
  }

  switch (message) {
    case "INVALID_STATE":
    case "Invalid state":
      // This is usually caused by waiting too long to go through the auth process
      // and can be fixed by trying again.
      message = "Your login session expired. Please try logging in again.";
      break;
    case "INTERNAL_ERROR":
      // This usually occurs because our auth hook threw an error but the
      // message itself isn't very useful so we show a more friendly message
      message = "We're sorry but we had a problem authenticating you. We're looking into it now!";
      break;
    case "IDP_CONFIGURATION_ERROR":
      message =
        "Failed to log in due to a configuration problem with your Replay account. Support has been notified!";
      break;
    case "IDP_UNEXPECTED_ERROR":
      message = "Failed to login. Please try logging in with SSO.";
      break;
    default:
      message = "An unexpected error occurred. Please try again.";
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
  const href = referrer ? `/?referrer=${referrer}` : "/";
  return <Link href={href}>{children}</Link>;
}

export default function Login({
  returnToPath = "",
  challenge,
  state,
}: {
  returnToPath?: string;
  challenge?: string;
  state?: string;
}) {
  const router = useRouter();
  const { loginWithRedirect, error, connection } = useAuth0();
  const [sso, setSSO] = useState(false);
  const [continueToLogin, setContinueToLogin] = useState(false);
  const token = useToken();
  const userInfo = useGetUserInfo();

  // `true` when we're in the process of completing the auth flow from the
  // Replay browser
  const isCompletingBrowserAuth = Boolean(userInfo && challenge && state);

  const url = new URL(returnToPath, window.location.origin);
  if (url.pathname === "/login" || (url.pathname === "/" && url.searchParams.has("state"))) {
    returnToPath = "/";
  }

  const onLogin = async (connection: string) => {
    // browser auth will redirect through this UX to select the connection
    if (challenge && state) {
      const authHost = getAuthHost();
      const clientId = getAuthClientId();
      // when continueToLogin was selected, the user was previously logged in
      // and wanted to select a different account so force the login prompt by
      // passing prompt=login to auth0
      window.location.href = `https://${authHost}/authorize?response_type=code&code_challenge_method=S256&code_challenge=${challenge}&client_id=${clientId}&redirect_uri=${returnToPath}&scope=openid profile offline_access&state=${state}&audience=https://api.replay.io&connection=${connection}&prompt=${
        continueToLogin ? "login" : ""
      }`;

      return;
    }

    await loginWithRedirect({
      appState: { returnTo: returnToPath },
      connection,
    });
  };

  const handleUseCurrentAuth = async () => {
    if (isCompletingBrowserAuth && connection) {
      await onLogin(connection);
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    setUserInBrowserPrefs(null);
  }, []);

  return (
    <OnboardingModalContainer theme="light">
      <OnboardingContentWrapper overlay>
        {token.token && userInfo.email && !continueToLogin ? (
          <SwitchAccountMessage
            label={isCompletingBrowserAuth ? "Continue with this account" : "Continue to Library"}
            user={userInfo}
            onSwitch={() => setContinueToLogin(true)}
            onCancel={() => handleUseCurrentAuth()}
          />
        ) : global.__IS_RECORD_REPLAY_RUNTIME__ && isOSX ? (
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

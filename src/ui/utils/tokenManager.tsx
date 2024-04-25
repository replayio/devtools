import { AppState, Auth0Context, Auth0ContextInterface, Auth0Provider } from "@auth0/auth0-react";
import jwt_decode from "jwt-decode";
import { ReactNode } from "react";

import { Deferred, assert, defer } from "protocol/utils";
import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";
import { isTest } from "shared/utils/environment";

import { getAuthClientId, getAuthHost } from "./auth";
import { listenForAccessToken } from "./browser";

const domain = getAuthHost();
const audience = "https://api.replay.io";

const tokenRefreshSecondsBeforeExpiry = 60;

const clientId = getAuthClientId();

export interface TokenState {
  external?: boolean;
  loading?: boolean;
  token?: string;
  error?: any;
}

type TokenListener = (state: TokenState) => void;

// This rather messy fn finds and parses the access token from auth0's local
// storage. This is necessary in the case of a redirect which happens before the
// usual auth0 hooks will be called with the token value.
function unstable_getAuth0Token() {
  const key = Object.keys({ ...localStorage }).find(
    s => s.includes("auth0spajs") && s.includes("https://api.replay.io")
  );
  const value = key && localStorage.getItem(key);

  if (value) {
    const accessToken: string | undefined = (JSON.parse(value) as any)?.body?.access_token;

    return accessToken;
  }
}

class TokenManager {
  auth0Client: Auth0ContextInterface | undefined;
  private deferredState = defer<TokenState>();
  private currentState?: TokenState;
  private isTokenRequested = false;
  private refreshTimeout: number | undefined;
  private listeners: TokenListener[] = [];

  constructor() {
    if (isTest()) {
      const url = new URL(window.location.href);
      const apiKey = url.searchParams.get("apiKey");
      if (apiKey) {
        this.currentState = {
          loading: false,
          token: apiKey,
        };
        this.deferredState.resolve(this.currentState);
      }
    }

    if (typeof window !== "undefined" && window.__IS_RECORD_REPLAY_RUNTIME__) {
      listenForAccessToken(token => {
        this.setExternalAuth(token);
      });
    }
  }

  Auth0Provider = ({ children, apiKey }: { apiKey?: string; children: ReactNode }) => {
    const onRedirectCallback = (appState: AppState) => {
      const accessToken = unstable_getAuth0Token();
      if (accessToken) {
        const decodedToken = jwt_decode<{ sub: string }>(accessToken);
        const authId = decodedToken.sub;
        recordTelemetryData("devtools-auth", {
          origin: "app",
          authId,
        });
      }

      if (appState?.returnTo) {
        // TODO [ryanjduffy]: We'd normally use router.replace but when other
        // code (components/Account/index in this case) also does a replace,
        // this redirect is dropped. There isn't a way to detect this in the
        // other component without adding more plumbing so, for now, let's full
        // page refresh to the return URL which is usually a recording and
        // warrants a reload anyway.
        window.location.href = appState.returnTo;
      }
    };

    // if (isTest()) {
    //   return <>{children}</>;
    // }

    return (
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        audience={audience}
        redirectUri={typeof window === "undefined" ? undefined : window.location.origin}
        onRedirectCallback={onRedirectCallback}
        cacheLocation="localstorage"
        prompt="select_account"
        useRefreshTokens={true}
      >
        <Auth0Context.Consumer>
          {auth0Client => {
            this.auth0Client = auth0Client;
            if (!apiKey && (!this.auth0Client || this.auth0Client.isLoading)) {
              return;
            }

            setTimeout(() => {
              if (apiKey) {
                this.setExternalAuth(apiKey);
              } else if (
                !this.currentState ||
                (!this.currentState.token && this.auth0Client?.isAuthenticated)
              ) {
                this.update(false);
              }
            }, 0);

            return null;
          }}
        </Auth0Context.Consumer>
        {children}
      </Auth0Provider>
    );
  };

  addListener(listener: TokenListener) {
    if (this.currentState) {
      listener(this.currentState);
    }
    this.listeners.push(listener);
  }

  removeListener(listener: TokenListener) {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  getState() {
    return this.currentState;
  }

  getToken() {
    return this.deferredState.promise;
  }

  /**
   * This method must be called before using Auth0's loginWithPopup() method.
   */
  reset() {
    this.deferredState = defer<TokenState>();
    this.isTokenRequested = false;
    if (this.refreshTimeout !== undefined) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
  }

  private setExternalAuth(token: string) {
    this.reset();
    this.setState({ token, external: true }, this.deferredState);
  }

  private async update(refresh: boolean) {
    if (!this.auth0Client || this.auth0Client.isLoading || typeof window === "undefined") {
      return;
    }

    if (window.__IS_RECORD_REPLAY_RUNTIME__) {
      this.setState({}, this.deferredState);
      return;
    }

    const wasAuthenticated = this.auth0Client.isAuthenticated;

    if (this.isTokenRequested) {
      if (refresh) {
        this.reset();
      } else {
        return;
      }
    }

    this.isTokenRequested = true;
    const deferredState = this.deferredState;

    const item = window.localStorage.getItem("__cypress");
    if (item) {
      const token = (JSON.parse(item) as any).body.access_token;
      this.setState({ token }, deferredState);
      return;
    }

    try {
      const token = await this.fetchToken(refresh);

      this.setState({ token }, deferredState);
      if (deferredState === this.deferredState) {
        this.setupTokenRefresh(token);
      }
    } catch (e) {
      // If we fail to fetch the token and the user was authenticated, we need
      // to report the error because the user will have expected to still be
      // authenticated but isn't.
      //
      // If the user had not logged in yet, we were trying to refresh their
      // access token via a refresh token. This could fail for either valid
      // reasons (an expired refresh token) or an error state (reused refresh
      // token, auth0 error, etc) but since the user was not in the middle of a
      // session, we can silently land them on the login page and let them try
      // to login fresh.
      if (wasAuthenticated) {
        this.setState({ error: e }, deferredState);
      } else {
        this.setState({}, this.deferredState);
      }
    }
  }

  private async fetchToken(refresh: boolean) {
    assert(this.auth0Client, "auth0Client not set yet");

    try {
      return await this.auth0Client.getAccessTokenSilently({ audience, ignoreCache: refresh });
    } catch (e: any) {
      if (e.error !== "consent_required") {
        throw e;
      }
      console.error("Failed to fetch the access token silently - this shouldn't happen!", e);

      return await this.auth0Client.getAccessTokenWithPopup({ audience, ignoreCache: refresh });
    }
  }

  private setState(state: TokenState, deferredState: Deferred<TokenState>) {
    this.currentState = state;
    this.listeners.forEach(listener => listener(state));
    deferredState.resolve(state);
  }

  private setupTokenRefresh(token: string) {
    const decodedToken = jwt_decode<{ exp: number }>(token);
    assert(typeof decodedToken.exp === "number", "token expiration must be a number");
    const refreshDelay = Math.max(
      (decodedToken.exp - tokenRefreshSecondsBeforeExpiry) * 1000 - Date.now(),
      0
    );
    this.refreshTimeout = window.setTimeout(() => this.update(true), refreshDelay);
  }
}

export default new TokenManager();

import { Auth0Context, Auth0ContextInterface, Auth0Provider } from "@auth0/auth0-react";
import { AppState } from "@auth0/auth0-react/dist/auth0-provider";
import jwt_decode from "jwt-decode";
import React, { ReactNode } from "react";
import { assert, defer, Deferred } from "protocol/utils";
import { useRouter } from "next/router";
import { listenForAccessToken } from "./browser";

const domain = "webreplay.us.auth0.com";
const audience = "https://api.replay.io";

const tokenRefreshSecondsBeforeExpiry = 60;

const clientId: string = "4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo";

export interface TokenState {
  external?: boolean;
  loading?: boolean;
  token?: string;
  error?: any;
}

type TokenListener = (state: TokenState) => void;

class TokenManager {
  auth0Client: Auth0ContextInterface | undefined;
  private deferredState = defer<TokenState>();
  private currentState?: TokenState;
  private isTokenRequested = false;
  private refreshTimeout: number | undefined;
  private listeners: TokenListener[] = [];

  constructor() {
    // if (isTest()) {
    //   this.currentState = {
    //     loading: false,
    //     token: "E2E-TEST-TOKEN",
    //   };
    //   this.deferredState.resolve(this.currentState);
    // }

    if (typeof window !== "undefined") {
      listenForAccessToken(token => {
        if (token) {
          this.setExternalAuth(token);
        }
      });
    }
  }

  Auth0Provider = ({ children, apiKey }: { apiKey?: string; children: ReactNode }) => {
    const router = useRouter();

    const onRedirectCallback = (appState: AppState) => {
      if (appState?.returnTo) {
        router.replace(appState?.returnTo);
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
    this.setState({ token, external: true }, this.deferredState);
  }

  private async update(refresh: boolean) {
    if (!this.auth0Client || this.auth0Client.isLoading) {
      return;
    }

    if (this.auth0Client.isAuthenticated) {
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
        const token = JSON.parse(item).body.access_token;
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
        this.setState({ error: e }, deferredState);
      }
    } else {
      this.setState({}, this.deferredState);
    }
  }

  private async fetchToken(refresh: boolean) {
    assert(this.auth0Client, "auth0Client not set yet");

    try {
      return await this.auth0Client.getAccessTokenSilently({ audience, ignoreCache: refresh });
    } catch (e: any) {
      if (e.error !== "login_required" && e.error !== "consent_required") {
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

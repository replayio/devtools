import React from "react";
import { useHistory } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

const Auth0ProviderWithHistory = ({ children }) => {
  const history = useHistory();

  const onRedirectCallback = appState => {
    history.push(appState?.returnTo || window.location.pathname);
  };

  const {
    location: { origin, pathname },
  } = window;

  return (
    <Auth0Provider
      domain={"webreplay.us.auth0.com"}
      clientId={"4FvFnJJW4XlnUyrXQF8zOLw6vNAH1MAo"}
      redirectUri={origin + pathname}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      prompt="select_account"
      audience="hasura-api"
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;

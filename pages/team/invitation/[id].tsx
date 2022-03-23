import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setExpectedError } from "ui/actions/session";
import Login from "ui/components/shared/Login/Login";
import hooks from "ui/hooks";
import useAuth0 from "ui/utils/useAuth0";
import useToken from "ui/utils/useToken";

export default function Share() {
  const auth0 = useAuth0();
  const { loading } = useToken();
  const { push, query } = useRouter();
  const dispatch = useDispatch();
  const [invitationCode] = Array.isArray(query.id) ? query.id : [query.id];
  const claimTeamInvitationCode = hooks.useClaimTeamInvitationCode(onCompleted, onError);

  function onCompleted() {
    push("/");
  }
  function onError() {
    dispatch(
      setExpectedError({
        message: "This team invitation code is invalid",
        content:
          "There seems to be a problem with your team invitation link. Please ask your team administrator to send you an up-to-date link.",
        action: "library",
      })
    );
  }

  useEffect(
    function handleTeamInvitationCode() {
      // The auth0 object is not reliable until the token has finished loading,
      // so we wait for loading to finish before doing anything with it.
      if (loading) {
        return;
      }

      if (auth0.isAuthenticated && invitationCode) {
        claimTeamInvitationCode({ variables: { code: invitationCode } });
      } else {
        // If the user is not logged in, show them the login screen
        const returnToPath = window.location.pathname + window.location.search;
        push({ pathname: "/login", query: { returnTo: returnToPath } });
      }
    },
    [loading]
  );

  return null;
}

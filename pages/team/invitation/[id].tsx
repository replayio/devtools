import { useRouter } from "next/router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setExpectedError } from "ui/actions/session";
import hooks from "ui/hooks";

export default function Share() {
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

  useEffect(function handleTeamInvitationCode() {
    claimTeamInvitationCode({ variables: { code: invitationCode } });
  }, []);
}

import React, { useState } from "react";
import hooks from "ui/hooks";
import { getUserId } from "ui/utils/useToken";
import "./ReplayInvitations.css";

export default function ReplayInvitations() {
  const [inputValue, setInputValue] = useState("");
  const { invitations, loading: inviteLoading } = hooks.useGetInvitations();
  const { isInternal, loading: userLoading } = hooks.useGetUserInfo();
  const addInvitation = hooks.useAddInvitation();
  const userId = getUserId();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputValue("");
    addInvitation({ variables: { userId, email: inputValue } });
  };

  if (inviteLoading || userLoading) {
    return (
      <li className="replay-invitations">
        <label className="setting-item">
          <div className="label">Loading...</div>
        </label>
      </li>
    );
  }

  const inviteCount = invitations.length;
  // Replay folks get unlimited invites.
  const maxInvites = isInternal ? Number.POSITIVE_INFINITY : 5;
  const label = `You have ${maxInvites - inviteCount} invite${
    maxInvites - inviteCount == 1 ? "" : "s"
  } left`;

  return (
    <li className="replay-invitations">
      <label className="setting-item">
        <div className="label">{label}</div>
        <div className="description">
          Replay is meant for sharing. Invite your team and friends below so they can start creating
          their own replays.
        </div>
      </label>
      {inviteCount < maxInvites && (
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Email Address"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          ></input>
          <input type="submit" value="Invite"></input>
        </form>
      )}
      <div className="invitations-list">
        {invitations.map((invite, i) => (
          <div className="invitations" key={i}>
            <div className={`material-icons ${invite.invited_user?.invited && "finished"}`}>
              {invite.invited_user?.invited ? "check_circle" : "pending"}
            </div>
            <div>{invite.invited_email}</div>
          </div>
        ))}
      </div>
    </li>
  );
}

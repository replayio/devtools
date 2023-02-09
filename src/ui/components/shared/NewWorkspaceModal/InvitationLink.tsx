import classNames from "classnames";
import React, { useRef, useState, useEffect } from "react";

import { Workspace } from "shared/graphql/types";
import hooks from "ui/hooks";

export function TextInputCopy({
  text,
  isLarge = false,
  isCenter = false,
}: {
  text: string;
  isLarge?: boolean;
  isCenter?: boolean;
}) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);

  const onClick = () => {
    navigator.clipboard.writeText(text);

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutKey.current);
    };
  }, []);

  return (
    <div className="relative flex w-full flex-col items-center p-0.5">
      <input
        className={classNames(
          isLarge ? "text-xl" : "text-sm",
          isCenter ? "text-center" : "",
          "block w-full rounded-md border border-textFieldBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-themeTextFieldColor focus:border-primaryAccent focus:ring-primaryAccent"
        )}
        type="text"
        value={text}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="absolute bottom-full mb-1.5 rounded-lg bg-gray-500 bg-opacity-90 p-1.5 text-base text-gray-200 shadow-2xl">
          Copied
        </div>
      ) : null}
    </div>
  );
}

function InvationDomainCheck({ workspace }: { workspace: Workspace }) {
  const updateWorkspaceCodeDomainLimitations = hooks.useUpdateWorkspaceCodeDomainLimitations();
  const handleToggle = () => {
    if (!workspace) {
      return;
    }
    updateWorkspaceCodeDomainLimitations({
      variables: { workspaceId: workspace.id, isLimited: !workspace.isDomainLimitedCode },
    });
  };

  if (workspace?.domain == "gmail.com") {
    return null;
  }

  const emptyWorkspaceLink = "Give access with anyone with a replay.io email address";
  const workspaceLink = (
    <span>
      Restrict this invite link to users with a{" "}
      <span className="font-medium ">{workspace.domain}</span> (including subdomains) email address
    </span>
  );

  return (
    <div className="flex flex-row items-center space-x-3 px-1.5">
      <input
        id="domain-limited"
        className="outline-none focus:outline-none"
        type="checkbox"
        disabled={!workspace}
        checked={!!workspace?.isDomainLimitedCode}
        onChange={handleToggle}
      />
      <label htmlFor="domain-limited">{workspace ? workspaceLink : emptyWorkspaceLink}</label>
    </div>
  );
}

export default function InvitationLink({
  workspaceId,
  showDomainCheck = true,
  isLarge = false,
  hideHeader = false,
  overlay = false,
}: {
  workspaceId: string;
  showDomainCheck?: boolean;
  isLarge?: boolean;
  hideHeader?: boolean;
  overlay?: boolean;
}) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  const workspace = workspaces?.find(w => workspaceId == w.id);
  if (!workspace) {
    return null;
  }

  const inputText = loading
    ? "Loading URL"
    : `https://app.replay.io/team/invitation?code=${workspace.invitationCode}`;

  return (
    <div className="relative flex w-full flex-col space-y-3">
      {overlay ? (
        <div className="pointer-events-none absolute -inset-8 top-0 bg-themeBase-60 opacity-10" />
      ) : null}
      {!hideHeader ? <div className="font-bold">{`Invite link`}</div> : null}
      <TextInputCopy text={inputText} isLarge={isLarge} />
      {showDomainCheck ? <InvationDomainCheck workspace={workspace} /> : null}
    </div>
  );
}

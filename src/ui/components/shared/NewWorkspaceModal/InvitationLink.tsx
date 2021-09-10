import classNames from "classnames";
import React, { useRef, useState } from "react";
import hooks from "ui/hooks";
import { Workspace } from "ui/types";

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

  return (
    <div className="relative flex flex-col items-center w-full p-0.5">
      <input
        className={classNames(
          isLarge ? "text-xl" : "text-sm",
          isCenter ? "text-center" : "",
          "focus:ring-primaryAccent focus:border-primaryAccent block w-full border px-2.5 py-1.5 border-textFieldBorder rounded-md"
        )}
        type="text"
        value={text}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="absolute bottom-full p-1.5 text-gray-200 bg-gray-500 bg-opacity-90 shadow-2xl rounded-lg mb-1.5 text-base">
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
      Give access to anyone with a <span className="font-medium ">{workspace.domain}</span> email address
    </span>
  );

  return (
    <div className="space-x-3 flex flex-row items-center px-1.5">
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
}: {
  workspaceId: string;
  showDomainCheck?: boolean;
  isLarge?: boolean;
  hideHeader?: boolean;
}) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  const workspace = workspaces?.find(w => workspaceId == w.id);
  if (!workspace) {
    return null;
  }

  const inputText = loading
    ? "Loading URL"
    : `https://app.replay.io/?invitationcode=${workspace.invitationCode}`;

  return (
    <div className="flex flex-col space-y-3 w-full">
      {!hideHeader ? <div className="text-xs uppercase font-bold">{`Invite link`}</div> : null}
      <TextInputCopy text={inputText} isLarge={isLarge} />
      {showDomainCheck ? <InvationDomainCheck workspace={workspace} /> : null}
    </div>
  );
}

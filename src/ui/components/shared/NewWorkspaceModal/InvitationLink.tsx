import React, { useRef, useState } from "react";
import hooks from "ui/hooks";
import { Workspace } from "ui/types";

function InvitationURL({ code }: { code: string }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const displayedText = `https://replay.io/view?invitationcode=${code}`;

  const onClick = () => {
    navigator.clipboard.writeText(displayedText);

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="relative flex flex-col items-center">
      <input
        className="focus:ring-primaryAccent focus:border-primaryAccent block w-full text-lg border px-3 py-2 border-gray-200 rounded-md"
        type="text"
        value={displayedText}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="absolute bottom-full p-2 bg-black bg-opacity-90 text-white shadow-2xl rounded-lg mb-2">
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

  const emptyWorkspaceLink = "Only users with a matching email address domain can use this link";
  const workspaceLink = (
    <span>
      Only users with a <span className="font-medium text-gray-700">{workspace.domain}</span>{" "}
      address can use this link
    </span>
  );

  return (
    <div className="space-x-4 flex flex-row items-center px-2">
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

export default function InvitationLink({ workspaceId }: { workspaceId: string }) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  const workspace = workspaces?.find(w => workspaceId == w.id);
  if (!workspace) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-gray-700 text-sm uppercase font-semibold">{`Invite link`}</div>
      <InvitationURL code={workspace ? workspace.invitationCode : "Loading URL"} />
      <InvationDomainCheck workspace={workspace} />
    </div>
  );
}

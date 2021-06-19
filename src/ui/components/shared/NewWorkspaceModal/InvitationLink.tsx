import React, { useRef, useState } from "react";
import hooks from "ui/hooks";

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
        className="focus:ring-blue-500 focus:border-blue-500 block w-full text-lg border px-3 py-2 border-gray-300 rounded-md"
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

export default function InvitationLink({ workspaceId }: { workspaceId: string }) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const updateWorkspaceCodeDomainLimitations = hooks.useUpdateWorkspaceCodeDomainLimitations();

  const workspace = workspaces.find(w => workspaceId == w.id);

  const handleToggle = () => {
    if (!workspace) {
      return;
    }
    updateWorkspaceCodeDomainLimitations({
      variables: { workspaceId, isLimited: !workspace.isDomainLimitedCode },
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-gray-700 text-sm uppercase font-semibold">{`Invite link`}</div>
      <InvitationURL code={workspace ? workspace.invitationCode : "Loading URL"} />
      <div className="space-x-4 flex flex-row items-center px-2">
        <input
          id="domain-limited"
          className="outline-none focus:outline-none"
          type="checkbox"
          disabled={!workspace}
          checked={!!workspace?.isDomainLimitedCode}
          onChange={handleToggle}
        />
        <label htmlFor="domain-limited">
          Only users with{" "}
          <span className="font-medium text-gray-700">
            {workspace ? `a ${workspace.domain} address` : `a matching email address domain`}
          </span>{" "}
          can use this link
        </label>
      </div>
    </div>
  );
}

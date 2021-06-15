import React, { useRef, useState } from "react";

export default function InvitationLink({ text }: { text: string }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const displayedText = `https://replay.io/view?invitationcode=${text}`;

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

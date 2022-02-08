import React, { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export default function Warning({ children, link }: { children: React.ReactNode; link?: string }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <div className="flex flex-col bg-red-100 py-1 px-2 font-sans leading-tight text-red-700">
      <div className="flex items-center space-x-1">
        <MaterialIcon>error</MaterialIcon>
        <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
          {children}
        </span>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer noopener">
            <span className="whitespace-pre underline">Read more</span>
          </a>
        ) : null}
        <button className="underline" onClick={() => setHidden(true)}>
          Hide
        </button>
      </div>
    </div>
  );
}

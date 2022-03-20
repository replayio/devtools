import React, { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export default function Warning({ children, link }: { children: React.ReactNode; link?: string }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <div className="flex flex-col message error font-sans leading-tight">
      <div className="flex items-center space-x-1 py-1">
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

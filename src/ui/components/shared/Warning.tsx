import React, { useState } from "react";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export default function Warning({ children, link }: { children: React.ReactNode; link?: string }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <div className="bg-red-100 text-red-700 py-1 px-2 flex flex-col leading-tight font-sans">
      <div className="flex space-x-1 items-center">
        <MaterialIcon>error</MaterialIcon>
        <span className="whitespace-pre overflow-ellipsis overflow-hidden flex-grow">
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

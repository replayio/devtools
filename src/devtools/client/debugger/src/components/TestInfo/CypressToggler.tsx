import React, { useState } from "react";

export function CypressToggler() {
  const [selectedState, setSelectedState] = useState<0 | 1 | null>(null);

  return (
    <div className="absolute flex h-full w-full items-end justify-center pb-4">
      <div className="flex rounded-md bg-themeToggleBgcolor p-1">
        <Button onClick={() => setSelectedState(0)} active={selectedState === 0}>Before</Button>
        <Button onClick={() => setSelectedState(1)} active={selectedState === 1}>After</Button>
        {/* <button className="rounded-md px-2 py-1 bg-themeToggleHandleBgcolor">After</button> */}
      </div>
    </div>
  )
}

function Button({children, active, onClick}: {children: string; onClick: () => void; active?: boolean; }) {
  return (
    <button className={`rounded-md px-2 py-1 ${active ? "bg-themeToggleHandleBgcolor" : ""}`} onClick={onClick}>
      {children}
    </button>
  )
}
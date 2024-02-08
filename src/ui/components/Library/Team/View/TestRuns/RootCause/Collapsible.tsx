import { useState } from "react";

export function Collapsible({ children, label }: { children: React.ReactNode; label: string }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-1">
        <button className="font-mono" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "▶" : "▼"}
        </button>
        <div className="truncate">{label}</div>
      </div>
      {!collapsed ? <div>{children}</div> : null}
    </div>
  );
}

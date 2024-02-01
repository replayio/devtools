import { useState } from "react";

export function Collapsible({ children, label }: { children: React.ReactNode; label: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-1">
        <div>{label}</div>
        <button onClick={() => setCollapsed(!collapsed)}>
          ({collapsed ? "expand" : "collapse"})
        </button>
      </div>
      {!collapsed ? <div>{children}</div> : null}
    </div>
  );
}

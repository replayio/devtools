import { ReactNode } from "react";

export function ListItem({ children }: { children: ReactNode }) {
  return <div className="p-4 bg-amber-200">{children}</div>;
}

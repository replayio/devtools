import { ReactNode } from "react";

export function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex w-96 flex-col items-center space-y-8 rounded-lg bg-modalBgcolor p-8 py-4 shadow-md">
      {children}
    </div>
  );
}

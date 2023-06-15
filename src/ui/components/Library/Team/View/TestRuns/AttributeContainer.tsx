import { ReactNode } from "react";

import MaterialIcon from "ui/components/shared/MaterialIcon";

export function AttributeContainer({
  children,
  icon,
  maxWidth = "none",
  title,
}: {
  children: ReactNode;
  icon?: string;
  title?: string | null;
  maxWidth?: string;
}) {
  if (!title && typeof children === "string") {
    title = children;
  }

  return (
    <div className="flex items-start space-x-1 overflow-hidden text-ellipsis" title={title ?? ""}>
      <div className="w-4">{icon ? <MaterialIcon>{icon}</MaterialIcon> : null}</div>
      <span style={{ maxWidth }} className="block overflow-hidden text-ellipsis whitespace-pre">
        {children}
      </span>
    </div>
  );
}

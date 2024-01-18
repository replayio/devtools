import { ReactNode } from "react";

import MaterialIcon from "ui/components/shared/MaterialIcon";

export function AttributeContainer({
  children,
  dataTestId,
  icon,
  maxWidth = "none",
  title,
}: {
  children: ReactNode;
  dataTestId?: string;
  icon?: string | null;
  title?: string | null;
  maxWidth?: string;
}) {
  if (!title && typeof children === "string") {
    title = children;
  }

  return (
    <div
      className="flex items-center space-x-1 overflow-hidden text-ellipsis"
      data-test-id={dataTestId}
      title={title ?? ""}
    >
      {icon ? <MaterialIcon className="w-4">{icon}</MaterialIcon> : null}
      <span style={{ maxWidth }} className="block overflow-hidden text-ellipsis whitespace-pre">
        {children}
      </span>
    </div>
  );
}

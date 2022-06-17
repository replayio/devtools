import MaterialIcon from "ui/components/shared/MaterialIcon";

export function AttributeContainer({
  children,
  icon,
  maxWidth = "none",
}: {
  children: string;
  icon?: string;
  title?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={`mr-4 flex items-center space-x-1 overflow-hidden text-ellipsis`}
      title={children}
    >
      {icon ? <MaterialIcon>{icon}</MaterialIcon> : null}
      <span style={{ maxWidth }} className="block overflow-hidden text-ellipsis whitespace-pre">
        {children}
      </span>
    </div>
  );
}

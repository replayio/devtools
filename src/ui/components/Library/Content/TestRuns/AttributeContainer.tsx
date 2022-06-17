import MaterialIcon from "ui/components/shared/MaterialIcon";

export function AttributeContainer({
  children,
  icon,
  maxWidth = "none",
  title,
}: {
  children: string;
  icon?: string;
  title?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={`mr-4 flex items-center space-x-1 overflow-hidden text-ellipsis`}
      title={title || children}
    >
      <div className="w-4">{icon ? <MaterialIcon>{icon}</MaterialIcon> : null}</div>
      <span style={{ maxWidth }} className="block overflow-hidden text-ellipsis whitespace-pre">
        {children}
      </span>
    </div>
  );
}

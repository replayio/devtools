import MaterialIcon from "ui/components/shared/MaterialIcon";

export function AttributeContainer({
  children,
  icon,
  title,
}: {
  children: string;
  icon?: string;
  title?: string;
}) {
  return (
    <div className="flex items-center space-x-1 overflow-hidden" title={children}>
      {icon ? <MaterialIcon>{icon}</MaterialIcon> : null}
      <span className="overflow-hidden whitespace-pre overflow-ellipsis">{children}</span>
    </div>
  );
}

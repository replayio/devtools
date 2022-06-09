import React from "react";

export default function SummaryRow({
  children,
  label,
  onClick,
}: {
  children: React.ReactElement;
  label: string | null;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="statement flex flex-grow" style={{ paddingLeft: 0 }}>
      {label ? <div className="w-6">{label}</div> : null}
      {children}
    </div>
  );
}

import React from "react";

export default function Modal({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) {
  return (
    <div
      className="fixed w-full h-full grid justify-center items-center z-50"
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div className="bg-black opacity-5 w-full h-full absolute" />
      <div className="z-10">{children}</div>
    </div>
  );
}

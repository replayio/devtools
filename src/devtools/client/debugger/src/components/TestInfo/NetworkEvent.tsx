import React from "react";

import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { selectAndFetchRequest } from "ui/actions/network";
import { useAppDispatch } from "ui/setup/hooks";

export function NetworkEvent({
  method,
  status,
  url,
  id,
}: {
  method: string;
  status?: number;
  url: string;
  id: string;
}) {
  const dispatch = useAppDispatch();
  const onClick = () => {
    dispatch(setViewMode("dev"));
    dispatch(setSelectedPanel("network"));
    dispatch(selectAndFetchRequest(id));
  };

  return (
    <button
      className="flex border-b border-themeBase-90 p-1 px-2 italic opacity-70 "
      onClick={onClick}
    >
      {method} {status} {new URL(url).pathname}
    </button>
  );
}

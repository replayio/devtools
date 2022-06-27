import { useContext } from "react";
import { ViewContext } from "./ViewPage";

export function FilterBar() {
  const { view } = useContext(ViewContext);
  return <div className="p-4 bg-blue-100">Filtering: {view}</div>;
}

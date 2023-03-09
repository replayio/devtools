import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";

export function ReactPanel() {
  return (
    <div>
      <div
        className="text-xl"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        React Renders <AccessibleImage className="annotation-logo react" />
      </div>
    </div>
  );
}

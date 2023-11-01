import Loader from "../shared/Loader";

export function SecondaryToolboxLoadingPanel() {
  return (
    <div className="toolbox-bottom-loading-panel">
      <Loader />
      <div className="toolbox-bottom-loading-panel-text">Loading...</div>
    </div>
  );
}

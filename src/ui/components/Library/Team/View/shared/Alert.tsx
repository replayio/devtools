export enum AlertType {
  MISSING_REPLAYS_FOR_TEST_RUN = "No replays were found for this run. They may be outside the retention window or may not have been uploaded",
  MISSING_REPLAYS_FOR_TEST = "This test has executions that are not reflected in the list of replays below",
}

export function Alert({ reason, link }: { reason: AlertType; link?: string }) {
  return (
    <div className="gap-3 rounded-lg bg-chrome p-3">
      <span>{reason}</span>
      <a href={link} rel="noreferrer" target="_blank" className="ml-1 underline">
        Learn more
      </a>
    </div>
  );
}

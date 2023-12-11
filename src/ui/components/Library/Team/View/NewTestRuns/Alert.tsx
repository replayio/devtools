export function Alert({ children, link }: { children: string; link?: string }) {
  let externalLink = null;

  if (externalLink) {
    externalLink = (
      <a href={link} rel="noreferrer" target="_blank">
        Learn more
      </a>
    );
  }

  return (
    <div className="gap-3 rounded-lg bg-chrome p-3">
      <span>{children}</span>
      <a href={link} rel="noreferrer" target="_blank" className="ml-1 underline">
        Learn more
      </a>
    </div>
  );
}

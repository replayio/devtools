interface UrlProps {
  href: string;
  value: string;
}

export default function Url({ href, value }: UrlProps) {
  return (
    <a className="theme-link" href={href} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

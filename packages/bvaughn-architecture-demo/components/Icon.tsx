export default function Icon({
  className,
  type,
}: {
  className?: string;
  type:
    | "cancel"
    | "collapsed"
    | "confirm"
    | "delete"
    | "edit"
    | "expanded"
    | "invisible"
    | "jump-to-definition"
    | "share"
    | "visible";
}) {
  let path = "";
  switch (type) {
    case "cancel": {
      path =
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
      break;
    }
    case "collapsed": {
      path = "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
      break;
    }
    case "confirm": {
      path = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
      break;
    }
    case "delete":
      path = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z";
      break;
    case "edit":
      path =
        "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z";
      break;
    case "expanded": {
      path = "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z";
      break;
    }
    case "invisible":
      path =
        "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";
      break;
    case "jump-to-definition":
      path = "M12.34,6V4H18v5.66h-2V7.41l-5,5V20H9v-7.58c0-0.53,0.21-1.04,0.59-1.41l5-5H12.34z";
      break;
    case "share":
      path = "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z";
      break;
    case "visible":
      path =
        "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
      break;
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d={path} />
    </svg>
  );
}

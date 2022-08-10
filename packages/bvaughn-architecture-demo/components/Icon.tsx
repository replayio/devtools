import { ReactNode } from "react";

export default function Icon({
  className,
  type,
}: {
  className?: string;
  type:
    | "add"
    | "arrow"
    | "breakpoint"
    | "cancel"
    | "close"
    | "comment"
    | "comments"
    | "confirm"
    | "delete"
    | "document"
    | "down"
    | "eager-evaluation"
    | "edit"
    | "error"
    | "fast-forward"
    | "folder"
    | "invisible"
    | "menu-closed"
    | "menu-open"
    | "prompt"
    | "protocol"
    | "remove"
    | "rewind"
    | "save"
    | "search"
    | "share"
    | "source-explorer"
    | "up"
    | "view-function-source"
    | "view-html-element"
    | "visible"
    | "warning";
}) {
  let path: ReactNode = null;
  switch (type) {
    case "add":
      path =
        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z";
      break;
    case "arrow":
      path = "M8 5v14l11-7z";
      break;
    case "breakpoint":
      path =
        "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z";
      break;
    case "cancel":
      path =
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
      break;
    case "close":
      path =
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
      break;
    case "comment":
      path =
        "M7.4342 23C7.64309 23 7.83706 22.951 8.01611 22.8531C8.20113 22.7552 8.41898 22.5931 8.66965 22.3667L12.0537 19.2735L17.6132 19.2827C18.5264 19.2827 19.3113 19.1022 19.9678 18.7412C20.6243 18.374 21.1256 17.8539 21.4718 17.1808C21.8239 16.5077 22 15.7061 22 14.776V7.50665C22 6.57656 21.8239 5.77497 21.4718 5.10188C21.1256 4.42879 20.6243 3.91173 19.9678 3.55071C19.3113 3.18357 18.5264 3 17.6132 3H6.38675C5.47359 3 4.68875 3.18357 4.03223 3.55071C3.38168 3.91173 2.88033 4.42879 2.5282 5.10188C2.17607 5.77497 2 6.57656 2 7.50665V14.776C2 15.7061 2.17905 16.5077 2.53715 17.1808C2.90122 17.8539 3.39958 18.371 4.03223 18.732C4.67084 19.093 5.40495 19.2735 6.23456 19.2735H6.48523V21.9169C6.48523 22.2474 6.56879 22.5105 6.7359 22.7063C6.90898 22.9021 7.14175 23 7.4342 23ZM7.6222 11.1413C7.6222 10.8232 7.72068 10.5631 7.91764 10.3612C8.12056 10.1531 8.37123 10.0491 8.66965 10.0491H10.9615V7.6994C10.9615 7.39345 11.06 7.13951 11.2569 6.93759C11.4539 6.72954 11.7046 6.62552 12.009 6.62552C12.3133 6.62552 12.564 6.72954 12.761 6.93759C12.9639 7.13951 13.0654 7.39345 13.0654 7.6994V10.0491H15.3662C15.6646 10.0491 15.9123 10.1531 16.1092 10.3612C16.3062 10.5631 16.4047 10.8232 16.4047 11.1413C16.4047 11.4473 16.3062 11.7043 16.1092 11.9123C15.9123 12.1143 15.6646 12.2152 15.3662 12.2152H13.0654V14.5649C13.0654 14.8709 12.9639 15.1248 12.761 15.3268C12.564 15.5287 12.3133 15.6296 12.009 15.6296C11.7046 15.6296 11.4539 15.5287 11.2569 15.3268C11.06 15.1248 10.9615 14.8709 10.9615 14.5649V12.2152H8.66965C8.37123 12.2152 8.12056 12.1143 7.91764 11.9123C7.72068 11.7043 7.6222 11.4473 7.6222 11.1413Z";
      break;
    case "comments":
      path =
        "M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z";
      break;
    case "confirm":
      path = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
      break;
    case "delete":
      path = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z";
      break;
    case "document":
      path =
        "M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z";
      break;
    case "down":
      path = "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z";
      break;
    case "eager-evaluation":
      path = "M9,19l1.41-1.41L5.83,13H22V11H5.83l4.59-4.59L9,5l-7,7L9,19z";
      break;
    case "edit":
      path =
        "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z";
      break;
    case "error":
      path =
        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z";
      break;
    case "fast-forward":
      path =
        "M19.5012 3C18.6769 3 18.0025 3.675 18.0025 4.5V19.5C18.0025 20.325 18.6769 21 19.5012 21C20.3256 21 21 20.325 21 19.5V4.5C21 3.675 20.3256 3 19.5012 3ZM14.0158 13.23L5.36805 19.335C4.3788 20.04 3 19.32 3 18.105V5.895C3 4.68 4.3638 3.975 5.36805 4.665L14.0158 10.77C14.8701 11.37 14.8701 12.63 14.0158 13.23Z";
      break;
    case "folder":
      path =
        "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z";
      break;
    case "invisible":
      path =
        "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";
      break;
    case "menu-closed":
      path = "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z";
      break;
    case "menu-open":
      path =
        "M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z";
      break;
    case "prompt":
      path = (
        <>
          <polygon points="6.41,6 5,7.41 9.58,12 5,16.59 6.41,18 12.41,12" />
          <polygon points="13,6 11.59,7.41 16.17,12 11.59,16.59 13,18 19,12" />
        </>
      );
      break;
    case "protocol":
      path =
        "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z";
      break;
    case "remove":
      path = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z";
      break;
    case "rewind":
      path =
        "M4.49875 3C5.32306 3 5.9975 3.675 5.9975 4.5V19.5C5.9975 20.325 5.32306 21 4.49875 21C3.67444 21 3 20.325 3 19.5V4.5C3 3.675 3.67444 3 4.49875 3ZM9.98418 13.23L18.6319 19.335C19.6212 20.04 21 19.32 21 18.105V5.895C21 4.68 19.6362 3.975 18.6319 4.665L9.98418 10.77C9.12988 11.37 9.12988 12.63 9.98418 13.23Z";
      break;
    case "save":
      path =
        "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z";
      break;
    case "search":
      path =
        "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z";
      break;
    case "share":
      path = "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z";
      break;
    case "source-explorer":
      path =
        "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z";
      break;
    case "up":
      path = "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z";
      break;
    case "view-function-source":
      path = "M12.34,6V4H18v5.66h-2V7.41l-5,5V20H9v-7.58c0-0.53,0.21-1.04,0.59-1.41l5-5H12.34z";
      break;
    case "view-html-element":
      path =
        "M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
      break;
    case "visible":
      path =
        "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
      break;
    case "warning":
      path = "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z";
      break;
  }

  if (typeof path === "string") {
    path = <path d={path} />;
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0z" fill="none" />
      {path}
    </svg>
  );
}

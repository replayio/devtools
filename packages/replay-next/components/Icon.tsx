import { CSSProperties, HTMLAttributes, ReactNode } from "react";

import styles from "./Icon.module.css";

export type IconType =
  | "add"
  | "arrow"
  | "arrow-left"
  | "arrow-nested"
  | "arrow-right"
  | "breakpoint"
  | "cancel"
  | "chevron-down"
  | "chevron-right"
  | "check"
  | "checked-rounded"
  | "close"
  | "comment"
  | "comments"
  | "conditional"
  | "confirm"
  | "console"
  | "continue-to-next"
  | "continue-to-previous"
  | "copy"
  | "delete"
  | "document"
  | "dots"
  | "down"
  | "eager-evaluation"
  | "edit"
  | "error"
  | "fast-forward"
  | "file"
  | "folder"
  | "folder-closed"
  | "folder-open"
  | "hide"
  | "inspect"
  | "invisible"
  | "invoke-getter"
  | "menu-closed"
  | "menu-open"
  | "open"
  | "pause"
  | "play"
  | "play-processed"
  | "play-unprocessed"
  | "preview"
  | "print"
  | "prompt"
  | "protocol"
  | "protocol-viewer"
  | "radio-selected"
  | "radio-unselected"
  | "remove"
  | "remove-alternate"
  | "rewind"
  | "save"
  | "search"
  | "set-focus-end"
  | "set-focus-start"
  | "share"
  | "source-explorer"
  | "step-one"
  | "step-two"
  | "step-three"
  | "step-four"
  | "spinner"
  | "terminal-prompt"
  | "terminal-result"
  | "toggle-off"
  | "toggle-on"
  | "unchecked-rounded"
  | "up"
  | "view-function-source"
  | "view-html-element"
  | "visible"
  | "warning";

export default function Icon({
  className = styles.DefaultIcon,
  style,
  type,
  ...rest
}: {
  className?: string;
  type: IconType;
  style?: CSSProperties;
} & HTMLAttributes<SVGElement>) {
  let path: ReactNode = null;
  switch (type) {
    case "add":
      path = "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z";
      break;
    case "arrow":
      path = "M8 5v14l11-7z";
      break;
    case "arrow-left":
      path =
        "M6.61041 11.2132L10.8896 8.20603L15.1689 5.19883C15.3545 5.06852 15.565 4.99995 15.7792 5C15.9935 5.00005 16.2039 5.06872 16.3895 5.19911C16.575 5.3295 16.7291 5.51703 16.8363 5.74285C16.9435 5.96868 16.9999 6.22484 17 6.48563V18.5143C16.9999 18.7751 16.9435 19.0313 16.8363 19.2571C16.7292 19.4829 16.5751 19.6705 16.3895 19.8009C16.204 19.9313 15.9935 19.9999 15.7792 20C15.565 20.0001 15.3545 19.9315 15.1689 19.8012L10.8896 16.794L6.61041 13.7868C6.42482 13.6564 6.27071 13.4689 6.16356 13.243C6.05641 13.0171 6 12.7609 6 12.5C6 12.2392 6.05641 11.983 6.16356 11.7571C6.27071 11.5312 6.42482 11.3436 6.61041 11.2132Z";
      break;
    case "arrow-nested":
      path =
        "M20 16L14.5 21.5L13.08 20.09L16.17 17H10.5C6.91 17 4 14.09 4 10.5V4H6V10.5C6 13 8 15 10.5 15H16.17L13.09 11.91L14.5 10.5L20 16Z";
      break;
    case "arrow-right":
      path =
        "M17.3896 12.7868L13.1104 15.794L8.83113 18.8012C8.64554 18.9315 8.43505 19 8.22079 19C8.00654 19 7.79606 18.9313 7.61051 18.8009C7.42496 18.6705 7.27087 18.483 7.1637 18.2571C7.05654 18.0313 7.00008 17.7752 7 17.5144L7 5.48569C7.00007 5.2249 7.05653 4.96872 7.16368 4.74289C7.27084 4.51706 7.42494 4.32952 7.61049 4.19912C7.79604 4.06872 8.00652 4.00005 8.22078 4C8.43504 3.99995 8.64554 4.06852 8.83113 4.19883L13.1104 7.20603L17.3896 10.2132C17.5752 10.3436 17.7293 10.5311 17.8364 10.757C17.9436 10.9829 18 11.2391 18 11.5C18 11.7608 17.9436 12.017 17.8364 12.2429C17.7293 12.4688 17.5752 12.6564 17.3896 12.7868Z";
      break;
    case "breakpoint":
      path =
        "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z";
      break;
    case "cancel":
      path =
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
      break;
    case "chevron-down":
      path = "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z";
      break;
    case "chevron-right":
      path = "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
      break;
    case "close":
      path =
        "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
      break;
    case "check":
      path = (
        <>
          <path
            d="M9 16.2l-3.5-3.5c-.39-.39-1.01-.39-1.4 0-.39.39-.39 1.01 0 1.4l4.19 4.19c.39.39 1.02.39 1.41 0L20.3 7.7c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0L9 16.2z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "checked-rounded":
      path = (
        <>
          <path
            d="M12 22C13.366 22 14.6503 21.7386 15.8529 21.2157C17.0621 20.6928 18.1274 19.9706 19.049 19.049C19.9706 18.1275 20.6928 17.0654 21.2157 15.8627C21.7386 14.6536 22 13.366 22 12C22 10.634 21.7386 9.34967 21.2157 8.14707C20.6928 6.93792 19.9706 5.87256 19.049 4.95098C18.1274 4.02942 17.0621 3.30719 15.8529 2.78432C14.6438 2.26144 13.3562 2 11.9902 2C10.6242 2 9.3366 2.26144 8.12745 2.78432C6.92484 3.30719 5.86273 4.02942 4.94118 4.95098C4.02614 5.87256 3.3072 6.93792 2.78431 8.14707C2.26144 9.34967 2 10.634 2 12C2 13.366 2.26144 14.6536 2.78431 15.8627C3.3072 17.0654 4.02942 18.1275 4.95097 19.049C5.87255 19.9706 6.93463 20.6928 8.13726 21.2157C9.34641 21.7386 10.634 22 12 22ZM12 20.3333C10.8431 20.3333 9.76143 20.1177 8.7549 19.6863C7.74837 19.2549 6.86275 18.6601 6.09803 17.902C5.33987 17.1373 4.7451 16.2516 4.31373 15.2451C3.88889 14.2386 3.67646 13.1569 3.67646 12C3.67646 10.8431 3.88889 9.76144 4.31373 8.75491C4.7451 7.74837 5.33987 6.86274 6.09803 6.09804C6.85622 5.33334 7.73857 4.73857 8.74511 4.31373C9.75164 3.88236 10.8333 3.66667 11.9902 3.66667C13.1471 3.66667 14.2288 3.88236 15.2353 4.31373C16.2484 4.73857 17.134 5.33334 17.8922 6.09804C18.6569 6.86274 19.2549 7.74837 19.6863 8.75491C20.1176 9.76144 20.3333 10.8431 20.3333 12C20.3333 13.1569 20.1176 14.2386 19.6863 15.2451C19.2614 16.2516 18.6667 17.1373 17.902 17.902C17.1373 18.6601 16.2516 19.2549 15.2451 19.6863C14.2386 20.1177 13.1569 20.3333 12 20.3333ZM10.9216 16.6471C11.2549 16.6471 11.5196 16.4967 11.7157 16.1961L16.1961 9.13727C16.2549 9.04575 16.3072 8.94773 16.3529 8.84314C16.4052 8.73204 16.4314 8.62092 16.4314 8.50982C16.4314 8.29413 16.3497 8.12092 16.1863 7.99021C16.0229 7.85948 15.8399 7.79413 15.6373 7.79413C15.3628 7.79413 15.134 7.94117 14.951 8.2353L10.8823 14.7647L8.95098 12.2647C8.83334 12.1079 8.71568 12.0033 8.59804 11.951C8.48692 11.8922 8.36275 11.8628 8.2255 11.8628C8.01635 11.8628 7.8366 11.9412 7.68628 12.098C7.54247 12.2484 7.47059 12.4314 7.47059 12.6471C7.47059 12.8497 7.54575 13.0523 7.69607 13.2549L10.0882 16.1961C10.2124 16.3529 10.3399 16.4673 10.4706 16.5392C10.6078 16.6111 10.7582 16.6471 10.9216 16.6471Z"
            fill="currentColor"
          />
        </>
      );
      break;
    case "comment":
      path =
        "M7.4342 22C7.64309 22 7.83706 21.951 8.01611 21.8531C8.20113 21.7552 8.41898 21.5931 8.66965 21.3667L12.0537 18.2735L17.6132 18.2827C18.5264 18.2827 19.3113 18.1022 19.9678 17.7412C20.6243 17.374 21.1256 16.8539 21.4718 16.1808C21.8239 15.5077 22 14.7061 22 13.776V6.50665C22 5.57656 21.8239 4.77497 21.4718 4.10188C21.1256 3.42879 20.6243 2.91173 19.9678 2.55071C19.3113 2.18357 18.5264 2 17.6132 2H6.38675C5.47359 2 4.68875 2.18357 4.03223 2.55071C3.38168 2.91173 2.88033 3.42879 2.5282 4.10188C2.17607 4.77497 2 5.57656 2 6.50665V13.776C2 14.7061 2.17905 15.5077 2.53715 16.1808C2.90122 16.8539 3.39958 17.371 4.03223 17.732C4.67084 18.093 5.40495 18.2735 6.23456 18.2735H6.48523V20.9169C6.48523 21.2474 6.56879 21.5105 6.7359 21.7063C6.90898 21.9021 7.14175 22 7.4342 22ZM7.6222 10.1413C7.6222 9.82316 7.72068 9.5631 7.91764 9.36117C8.12056 9.15313 8.37123 9.04911 8.66965 9.04911H10.9615V6.6994C10.9615 6.39345 11.06 6.13951 11.2569 5.93759C11.4539 5.72954 11.7046 5.62552 12.009 5.62552C12.3133 5.62552 12.564 5.72954 12.761 5.93759C12.9639 6.13951 13.0654 6.39345 13.0654 6.6994V9.04911H15.3662C15.6646 9.04911 15.9123 9.15313 16.1092 9.36117C16.3062 9.5631 16.4047 9.82316 16.4047 10.1413C16.4047 10.4473 16.3062 10.7043 16.1092 10.9123C15.9123 11.1143 15.6646 11.2152 15.3662 11.2152H13.0654V13.5649C13.0654 13.8709 12.9639 14.1248 12.761 14.3268C12.564 14.5287 12.3133 14.6296 12.009 14.6296C11.7046 14.6296 11.4539 14.5287 11.2569 14.3268C11.06 14.1248 10.9615 13.8709 10.9615 13.5649V11.2152H8.66965C8.37123 11.2152 8.12056 11.1143 7.91764 10.9123C7.72068 10.7043 7.6222 10.4473 7.6222 10.1413Z";
      break;
    case "comments":
      path =
        "M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z";
      break;
    case "conditional":
      path = (
        <>
          <g opacity={0.5}>
            <path
              clipRule="evenodd"
              d="M1.5 5.69013C1.5 6.33298 2.02113 6.85411 2.66398 6.85411L16.6317 6.85411C17.2746 6.85411 17.7957 6.33298 17.7957 5.69013C17.7957 5.04728 17.2746 4.52615 16.6317 4.52615L2.66398 4.52615C2.02113 4.52615 1.5 5.04728 1.5 5.69013Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              d="M21.8705 6.69786C22.6464 6.24984 22.6464 5.1298 21.8705 4.68179L16.6326 1.65769C15.8566 1.20967 14.8866 1.76969 14.8866 2.66572L14.8866 8.71392C14.8866 9.60996 15.8566 10.17 16.6326 9.72196L21.8705 6.69786Z"
              fill="currentColor"
            ></path>
          </g>
          <path
            clipRule="evenodd"
            d="M1.5 5.69015C1.5 6.333 2.02113 6.85413 2.66398 6.85413C4.155 6.85413 6.16581 6.87659 7.81772 7.85549C9.34116 8.75827 10.8118 10.6448 10.8118 15.002C10.8118 15.6448 11.333 16.166 11.9758 16.166C12.6186 16.166 13.1398 15.6448 13.1398 15.002C13.1398 10.0474 11.4095 7.27795 9.00451 5.85277C6.76418 4.52516 4.16689 4.52581 2.73256 4.52617C2.70939 4.52617 2.68653 4.52618 2.66398 4.52618C2.02113 4.52618 1.5 5.04731 1.5 5.69015Z"
            fill="currentColor"
            fillRule="evenodd"
          ></path>
          <path
            d="M11.4944 22.316C11.7083 22.6863 12.2428 22.6863 12.4566 22.316L16.5346 15.2527C16.7484 14.8823 16.4812 14.4194 16.0535 14.4194L7.89751 14.4194C7.46989 14.4194 7.20262 14.8823 7.41644 15.2527L11.4944 22.316Z"
            fill="currentColor"
          ></path>
        </>
      );
      break;
    case "confirm":
      path = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
      break;
    case "console":
      path =
        "M6.48242 8.4209H13.918C14.0762 8.4209 14.2051 8.36816 14.3047 8.2627C14.4102 8.15723 14.4629 8.02832 14.4629 7.87598C14.4629 7.72363 14.4102 7.59766 14.3047 7.49805C14.2051 7.39258 14.0762 7.33984 13.918 7.33984H6.48242C6.32422 7.33984 6.19238 7.39258 6.08691 7.49805C5.9873 7.59766 5.9375 7.72363 5.9375 7.87598C5.9375 8.02832 5.9873 8.15723 6.08691 8.2627C6.19238 8.36816 6.32422 8.4209 6.48242 8.4209ZM6.48242 16.8145H13.918C14.0762 16.8145 14.2051 16.7646 14.3047 16.665C14.4102 16.5654 14.4629 16.4395 14.4629 16.2871C14.4629 16.1289 14.4102 15.9971 14.3047 15.8916C14.2051 15.7861 14.0762 15.7334 13.918 15.7334H6.48242C6.32422 15.7334 6.19238 15.7861 6.08691 15.8916C5.9873 15.9971 5.9375 16.1289 5.9375 16.2871C5.9375 16.4395 5.9873 16.5654 6.08691 16.665C6.19238 16.7646 6.32422 16.8145 6.48242 16.8145ZM4.75977 20.1807H19.9648C20.8906 20.1807 21.582 19.9521 22.0391 19.4951C22.4961 19.0439 22.7246 18.3643 22.7246 17.4561V6.72461C22.7246 5.81641 22.4961 5.13672 22.0391 4.68555C21.582 4.22852 20.8906 4 19.9648 4H4.75977C3.83984 4 3.14844 4.22852 2.68555 4.68555C2.22852 5.13672 2 5.81641 2 6.72461V17.4561C2 18.3643 2.22852 19.0439 2.68555 19.4951C3.14844 19.9521 3.83984 20.1807 4.75977 20.1807ZM4.77734 18.7656C4.33789 18.7656 4.00098 18.6514 3.7666 18.4229C3.53223 18.1885 3.41504 17.8428 3.41504 17.3857V6.79492C3.41504 6.33789 3.53223 5.99512 3.7666 5.7666C4.00098 5.53223 4.33789 5.41504 4.77734 5.41504H19.9473C20.3809 5.41504 20.7148 5.53223 20.9492 5.7666C21.1895 5.99512 21.3096 6.33789 21.3096 6.79492V17.3857C21.3096 17.8428 21.1895 18.1885 20.9492 18.4229C20.7148 18.6514 20.3809 18.7656 19.9473 18.7656H4.77734ZM5.7002 14.1514H19.0332C19.3965 14.1514 19.6807 14.0459 19.8857 13.835C20.0908 13.6182 20.1934 13.3281 20.1934 12.9648V11.1807C20.1934 10.8174 20.0908 10.5303 19.8857 10.3193C19.6807 10.1025 19.3965 9.99414 19.0332 9.99414H5.7002C5.33691 9.99414 5.05273 10.1025 4.84766 10.3193C4.64258 10.5303 4.54004 10.8174 4.54004 11.1807V12.9648C4.54004 13.3281 4.64258 13.6182 4.84766 13.835C5.05273 14.0459 5.33691 14.1514 5.7002 14.1514ZM6.49121 12.6221C6.32715 12.6221 6.19238 12.5693 6.08691 12.4639C5.9873 12.3584 5.9375 12.2266 5.9375 12.0684C5.9375 11.9219 5.9873 11.7988 6.08691 11.6992C6.19238 11.5938 6.32715 11.541 6.49121 11.541H10.8154C10.9736 11.541 11.1025 11.5938 11.2021 11.6992C11.3076 11.7988 11.3604 11.9219 11.3604 12.0684C11.3604 12.2266 11.3076 12.3584 11.2021 12.4639C11.1025 12.5693 10.9736 12.6221 10.8154 12.6221H6.49121Z";
      break;
    case "continue-to-next":
      path = "M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z";
      break;
    case "continue-to-previous":
      path = "M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z";
      break;
    case "copy":
      path =
        "M11.0572 20.5417V9.70833H14.4172V13.5774C14.4172 14.0045 14.7935 14.3512 15.2572 14.3512H19.4572V20.5417H11.0572ZM9.34286 11.125V14.125H4.71429V3.625H7.8V7.375C7.8 7.789 8.1456 8.125 8.57143 8.125H12.4286C10.7253 8.125 9.34286 9.469 9.34286 11.125ZM13.0115 7.00083H9.25718V3.35083L13.0115 7.00083ZM19.2857 13H15.8571V9.66668L19.2857 13ZM20.6233 12.3662L16.7661 8.61625C16.5257 8.38125 16.1991 8.25 15.8571 8.25H14.5714V7C14.5714 6.66875 14.4364 6.35 14.1947 6.11625L10.3376 2.36625C10.0971 2.13125 9.76929 2 9.42857 2H5.57143C4.152 2 3 3.12 3 4.5V13.25C3 14.63 4.152 15.75 5.57143 15.75H9.42857V19.5C9.42857 20.88 10.5806 22 12 22H18.4286C19.848 22 21 20.88 21 19.5V13.25C21 12.9187 20.865 12.6 20.6233 12.3662Z";
      break;
    case "delete":
      path = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z";
      break;
    case "document":
      path =
        "M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z";
      break;
    case "dots":
      path =
        "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z";
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
    case "file":
      path =
        "M6 22q-.825 0-1.412-.587Q4 20.825 4 20V4q0-.825.588-1.413Q5.175 2 6 2h8l6 6v12q0 .825-.587 1.413Q18.825 22 18 22Zm7-13V4H6v16h12V9ZM6 4v5-5 16V4Z";
      break;
    case "folder":
    case "folder-closed":
      path =
        "M20,18H4V8H20M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z";
      break;
    case "folder-open":
      path =
        "M6.1,10L4,18V8H21A2,2 0 0,0 19,6H12L10,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H19C19.9,20 20.7,19.4 20.9,18.5L23.2,10H6.1M19,18H6L7.6,12H20.6L19,18Z";
      break;
    case "hide":
      path =
        "M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z";
      break;
    case "inspect":
      path =
        "M8.5,22H3.7l-1.4-1.5V3.8l1.3-1.5h17.2l1,1.5v4.9h-1.3V4.3l-0.4-0.6H4.2L3.6,4.3V20l0.7,0.7h4.2V22z M23,13.9l-4.6,3.6l4.6,4.6l-1.1,1.1l-4.7-4.4l-3.3,4.4l-3.2-12.3L23,13.9z";
      break;
    case "invisible":
      path =
        "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z";
      break;
    case "invoke-getter":
      path = (
        <>
          <polygon points="6.41,6 5,7.41 9.58,12 5,16.59 6.41,18 12.41,12" />
          <polygon points="13,6 11.59,7.41 16.17,12 11.59,16.59 13,18 19,12" />
        </>
      );
      break;
    case "menu-closed":
      path = "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z";
      break;
    case "menu-open":
      path =
        "M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z";
      break;
    case "open":
      path =
        "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z";
      break;
    case "pause":
      path =
        "M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,16H9V8h2V16z M15,16h-2V8h2V16z";
      break;
    case "play":
      path =
        "M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z";
      break;
    case "play-processed":
      path = (
        <>
          <svg
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.699805 10.7657C0.699805 5.60188 4.88594 1.41575 10.0498 1.41575C15.2137 1.41575 19.3998 5.60188 19.3998 10.7657C19.3998 15.9296 15.2137 20.1157 10.0498 20.1157C4.88594 20.1157 0.699805 15.9296 0.699805 10.7657ZM8.57474 15.0503L13.6135 11.8179C14.3803 11.326 14.3803 10.2055 13.6135 9.71362L8.57474 6.48124C7.74279 5.94755 6.6498 6.54495 6.6498 7.53337V13.9981C6.6498 14.9865 7.7428 15.5839 8.57474 15.0503Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </>
      );
      break;
    case "play-unprocessed":
      path = (
        <>
          <svg
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1.58408"
              y="0.97196"
              width="18.7"
              height="18.7"
              rx="9.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M14.1468 9.81694C14.5149 10.053 14.5149 10.5909 14.1468 10.827L9.10805 14.0594C8.70872 14.3155 8.18408 14.0288 8.18408 13.5543V7.08958C8.18408 6.61514 8.70872 6.32839 9.10805 6.58456L14.1468 9.81694Z"
              fill="currentColor"
            />
          </svg>
        </>
      );
      break;
    case "preview":
      path =
        "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
      break;
    case "print":
      path =
        "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z";
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
    case "protocol-viewer":
      path =
        "M7.77 6.76L6.23 5.48.82 12l5.41 6.52 1.54-1.28L3.42 12l4.35-5.24zM7 13h2v-2H7v2zm10-2h-2v2h2v-2zm-6 2h2v-2h-2v2zm6.77-7.52l-1.54 1.28L20.58 12l-4.35 5.24 1.54 1.28L23.18 12l-5.41-6.52z";
      break;
    case "radio-selected":
      path =
        "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7Z";
      break;
    case "radio-unselected":
      path =
        "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";
      break;
    case "remove":
      path = "M19 13H5v-2h14v2z";
      break;
    case "remove-alternate":
      path =
        "M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z";
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
    case "set-focus-end":
      path = (
        <>
          <path
            fill="currentColor"
            d="M20.0885 12.1788C19.9705 12.0987 19.9705 11.9013 20.0885 11.8212L22.7303 10.0288C22.8497 9.94777 23 10.0474 23 10.2076L23 13.7924C23 13.9526 22.8497 14.0522 22.7303 13.9712L20.0885 12.1788Z"
          />
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 7C6.89543 7 6 7.89543 6 9V15C6 16.1046 6.89543 17 8 17H16C17.1046 17 18 16.1046 18 15V9C18 7.89543 17.1046 7 16 7H8ZM15 7.71429H9V16.2857H15V7.71429Z"
          />
        </>
      );
      break;
    case "set-focus-start":
      path = (
        <>
          <path
            fill="curentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 7C6.89543 7 6 7.89543 6 9V15C6 16.1046 6.89543 17 8 17H16C17.1046 17 18 16.1046 18 15V9C18 7.89543 17.1046 7 16 7H8ZM15 7.71429H9V16.2857H15V7.71429Z"
          />
          <path
            fill="curentColor"
            d="M3.91147 11.8212C4.02951 11.9013 4.02951 12.0987 3.91147 12.1788L1.26968 13.9712C1.15029 14.0522 1 13.9526 1 13.7924V10.2076C1 10.0474 1.15029 9.94777 1.26968 10.0288L3.91147 11.8212Z"
          />
        </>
      );
      break;
    case "share":
      path =
        "M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9A2,2 0 0,1 6,7H9V9H6V21H18V9H15V7H18A2,2 0 0,1 20,9V21A2,2 0 0,1 18,23Z";
      break;
    case "source-explorer":
      path =
        "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z";
      break;
    case "step-one":
      path = (
        <>
          <path
            d="M22.0073 12.0039C22.0073 17.5268 17.5302 22.0039 12.0073 22.0039C6.48448 22.0039 2.00732 17.5268 2.00732 12.0039C2.00732 6.48106 6.48448 2.00391 12.0073 2.00391C17.5302 2.00391 22.0073 6.48106 22.0073 12.0039Z"
            fill="currentColor"
          />
          <path
            d="M11.6707 14.5881V11.3596C11.6707 10.6799 11.6843 10.1545 11.7117 9.78341C11.6023 9.93575 11.405 10.1291 11.1199 10.3635L10.2117 11.0959L9.39136 10.0529L11.9343 8.03146H13.1824V14.5881H14.5769V15.9182H10.2585V14.5881H11.6707Z"
            fill="#DEE6ED"
          />
        </>
      );
      break;
    case "step-two":
      path = (
        <>
          <path
            d="M22.0073 12.0039C22.0073 17.5268 17.5302 22.0039 12.0073 22.0039C6.48448 22.0039 2.00732 17.5268 2.00732 12.0039C2.00732 6.48106 6.48448 2.00391 12.0073 2.00391C17.5302 2.00391 22.0073 6.48106 22.0073 12.0039Z"
            fill="currentColor"
          />
          <path
            d="M14.7937 15.9182H9.28589V14.7522L11.3367 12.7248C12.1023 11.967 12.5789 11.4416 12.7664 11.1486C12.9578 10.8557 13.0535 10.5529 13.0535 10.2404C13.0535 9.93966 12.9617 9.70529 12.7781 9.53732C12.5945 9.36544 12.3464 9.2795 12.0339 9.2795C11.7253 9.2795 11.4226 9.342 11.1257 9.467C10.8289 9.5881 10.491 9.79904 10.1121 10.0998L9.26245 9.03927C9.67261 8.73068 9.99878 8.50997 10.241 8.37716C10.4871 8.24044 10.7644 8.12911 11.073 8.04318C11.3816 7.95724 11.7175 7.91427 12.0808 7.91427C12.8269 7.91427 13.4265 8.1174 13.8796 8.52365C14.3367 8.9299 14.5652 9.44747 14.5652 10.0764C14.5652 10.4631 14.491 10.8303 14.3425 11.1779C14.198 11.5217 13.9734 11.8713 13.6687 12.2268C13.364 12.5783 12.8992 13.0451 12.2742 13.6272L11.3484 14.4885V14.5529H14.7937V15.9182Z"
            fill="#DEE6ED"
          />
        </>
      );
      break;

    case "step-three":
      path = (
        <>
          <path
            d="M22.0073 12.0039C22.0073 17.5268 17.5302 22.0039 12.0073 22.0039C6.48448 22.0039 2.00732 17.5268 2.00732 12.0039C2.00732 6.48106 6.48448 2.00391 12.0073 2.00391C17.5302 2.00391 22.0073 6.48106 22.0073 12.0039Z"
            fill="currentColor"
          />
          <path
            d="M12.8015 11.7639V11.8049C14.0671 11.9611 14.7 12.592 14.7 13.6975C14.7 14.424 14.4285 14.9963 13.8855 15.4143C13.3425 15.8283 12.5652 16.0354 11.5535 16.0354C10.6902 16.0354 9.93433 15.8928 9.28589 15.6076V14.2014C9.61011 14.3615 9.96167 14.4885 10.3406 14.5822C10.7234 14.6721 11.0964 14.717 11.4597 14.717C12.0339 14.717 12.4617 14.6272 12.7429 14.4475C13.0281 14.2678 13.1707 13.9904 13.1707 13.6154C13.1707 13.1975 13.0125 12.9026 12.696 12.7307C12.3796 12.5588 11.8699 12.4729 11.1667 12.4729H10.4988V11.2365H11.1316C11.7488 11.2365 12.2156 11.1565 12.532 10.9963C12.8484 10.8361 13.0066 10.5529 13.0066 10.1467C13.0066 9.85763 12.9109 9.63302 12.7195 9.47286C12.5281 9.31271 12.2312 9.23263 11.8289 9.23263C11.532 9.23263 11.241 9.2795 10.9558 9.37325C10.6707 9.4631 10.366 9.60958 10.0417 9.81271L9.29761 8.68185C10.1257 8.17013 10.9968 7.91427 11.9109 7.91427C12.7156 7.91427 13.3484 8.08419 13.8093 8.42404C14.2742 8.75997 14.5066 9.21896 14.5066 9.80099C14.5066 10.2932 14.3582 10.7111 14.0613 11.0549C13.7683 11.3947 13.3484 11.6311 12.8015 11.7639Z"
            fill="#DEE6ED"
          />
        </>
      );
      break;

    case "step-four":
      path = (
        <>
          <path
            d="M22.0073 12.0039C22.0073 17.5268 17.5302 22.0039 12.0073 22.0039C6.48448 22.0039 2.00732 17.5268 2.00732 12.0039C2.00732 6.48106 6.48448 2.00391 12.0073 2.00391C17.5302 2.00391 22.0073 6.48106 22.0073 12.0039Z"
            fill="currentColor"
          />
          <path
            d="M14.5205 14.2249H13.501V15.9182H12.0127V14.2249H8.5791V13.0881L12.0361 8.03149H13.501V12.9534H14.5205V14.2249ZM12.0127 12.9534V11.5764C12.0127 10.8147 12.0361 10.2463 12.083 9.87134H12.0479C11.8955 10.2034 11.7236 10.5159 11.5322 10.8088L10.0908 12.9534H12.0127Z"
            fill="#DEE6ED"
          />
        </>
      );
      break;

    case "spinner":
      path =
        "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z";
      break;
    case "terminal-prompt":
      path = (
        <g>
          <polygon points="6.41,6 5,7.41 9.58,12 5,16.59 6.41,18 12.41,12" />
          <polygon points="13,6 11.59,7.41 16.17,12 11.59,16.59 13,18 19,12" />
        </g>
      );
      break;
    case "terminal-result":
      path = "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z";
      break;
    case "toggle-off":
      path =
        "m16.1 13.3-1.45-1.45q.225-1.175-.675-2.2-.9-1.025-2.325-.8L10.2 7.4q.425-.2.862-.3Q11.5 7 12 7q1.875 0 3.188 1.312Q16.5 9.625 16.5 11.5q0 .5-.1.938-.1.437-.3.862Zm3.2 3.15-1.45-1.4q.95-.725 1.688-1.588.737-.862 1.262-1.962-1.25-2.525-3.588-4.013Q14.875 6 12 6q-.725 0-1.425.1-.7.1-1.375.3L7.65 4.85q1.025-.425 2.1-.638Q10.825 4 12 4q3.775 0 6.725 2.087Q21.675 8.175 23 11.5q-.575 1.475-1.512 2.738Q20.55 15.5 19.3 16.45Zm.5 6.15-4.2-4.15q-.875.275-1.762.413Q12.95 19 12 19q-3.775 0-6.725-2.087Q2.325 14.825 1 11.5q.525-1.325 1.325-2.463Q3.125 7.9 4.15 7L1.4 4.2l1.4-1.4 18.4 18.4ZM5.55 8.4q-.725.65-1.325 1.425T3.2 11.5q1.25 2.525 3.587 4.012Q9.125 17 12 17q.5 0 .975-.062.475-.063.975-.138l-.9-.95q-.275.075-.525.112Q12.275 16 12 16q-1.875 0-3.188-1.312Q7.5 13.375 7.5 11.5q0-.275.037-.525.038-.25.113-.525Zm7.975 2.325ZM9.75 12.6Z";
      break;
    case "toggle-on":
      path =
        "M12 16q1.875 0 3.188-1.312Q16.5 13.375 16.5 11.5q0-1.875-1.312-3.188Q13.875 7 12 7q-1.875 0-3.188 1.312Q7.5 9.625 7.5 11.5q0 1.875 1.312 3.188Q10.125 16 12 16Zm0-1.8q-1.125 0-1.912-.788Q9.3 12.625 9.3 11.5t.788-1.913Q10.875 8.8 12 8.8t1.913.787q.787.788.787 1.913t-.787 1.912q-.788.788-1.913.788Zm0 4.8q-3.65 0-6.65-2.038-3-2.037-4.35-5.462 1.35-3.425 4.35-5.463Q8.35 4 12 4q3.65 0 6.65 2.037 3 2.038 4.35 5.463-1.35 3.425-4.35 5.462Q15.65 19 12 19Zm0-7.5Zm0 5.5q2.825 0 5.188-1.488Q19.55 14.025 20.8 11.5q-1.25-2.525-3.612-4.013Q14.825 6 12 6 9.175 6 6.812 7.487 4.45 8.975 3.2 11.5q1.25 2.525 3.612 4.012Q9.175 17 12 17Z";
      break;
    case "unchecked-rounded":
      path = (
        <>
          <path
            d="M12 22C13.366 22 14.6503 21.7386 15.8529 21.2157C17.0621 20.6928 18.1275 19.9706 19.049 19.049C19.9706 18.1275 20.6928 17.0654 21.2157 15.8627C21.7386 14.6536 22 13.366 22 12C22 10.634 21.7386 9.34967 21.2157 8.14707C20.6928 6.93792 19.9706 5.87256 19.049 4.95098C18.1275 4.02942 17.0621 3.30719 15.8529 2.78432C14.6438 2.26144 13.3562 2 11.9902 2C10.6242 2 9.33659 2.26144 8.12745 2.78432C6.92484 3.30719 5.86273 4.02942 4.94118 4.95098C4.02614 5.87256 3.3072 6.93792 2.78431 8.14707C2.26144 9.34967 2 10.634 2 12C2 13.366 2.26144 14.6536 2.78431 15.8627C3.3072 17.0654 4.02942 18.1275 4.95097 19.049C5.87255 19.9706 6.93463 20.6928 8.13726 21.2157C9.34641 21.7386 10.634 22 12 22ZM12 20.3333C10.8431 20.3333 9.76143 20.1177 8.7549 19.6863C7.74837 19.2549 6.86275 18.6601 6.09803 17.902C5.33987 17.1373 4.7451 16.2516 4.31373 15.2451C3.88889 14.2386 3.67646 13.1569 3.67646 12C3.67646 10.8431 3.88889 9.76144 4.31373 8.75491C4.7451 7.74837 5.33987 6.86274 6.09803 6.09804C6.85622 5.33334 7.73857 4.73857 8.74511 4.31373C9.75164 3.88236 10.8333 3.66667 11.9902 3.66667C13.1471 3.66667 14.2288 3.88236 15.2353 4.31373C16.2484 4.73857 17.134 5.33334 17.8922 6.09804C18.6569 6.86274 19.2549 7.74837 19.6863 8.75491C20.1176 9.76144 20.3333 10.8431 20.3333 12C20.3333 13.1569 20.1176 14.2386 19.6863 15.2451C19.2614 16.2516 18.6667 17.1373 17.902 17.902C17.1373 18.6601 16.2516 19.2549 15.2451 19.6863C14.2386 20.1177 13.1569 20.3333 12 20.3333Z"
            fill="currentColor"
          />
        </>
      );
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
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" {...rest}>
      <path d="M0 0h24v24H0z" fill="none" />
      {path}
    </svg>
  );
}

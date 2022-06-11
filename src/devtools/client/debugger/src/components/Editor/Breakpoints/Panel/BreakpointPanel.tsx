import type { Breakpoint } from "devtools/client/debugger/src/reducers/types";
import classNames from "classnames";
import { AddCommentButton, Column, Row } from "components";
import PrefixBadgeButton from "ui/components/PrefixBadge";

export default function BreakpointPanel({
  breakpoint,
  children,
  editing,
}: {
  breakpoint: Breakpoint;
  children: React.ReactNode;
  editing: boolean;
}) {
  return (
    <Column>
      <Row
        paddingHorizontal={2}
        paddingVertical={1}
        gap={1}
        className="items-center"
        style={{
          backgroundColor: "#ECE9FF",
          color: "#5546AD",
        }}
      >
        <ConditionalIcon />
        <div style={{ flex: 1 }}>Conditional</div>
        <CloseIcon />
      </Row>
      <Row
        paddingLeft={1}
        paddingRight={2}
        paddingVertical={1}
        className="items-center"
        style={{
          backgroundColor: "var(--breakpoint-editfield-active)",
        }}
      >
        <PrefixBadgeButton breakpoint={breakpoint} />
        <div style={{ flex: 1 }}>{children}</div>
        <AddCommentButton />
      </Row>
    </Column>
  );
}

function ConditionalIcon() {
  return (
    <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00694 2.12306C9.3212 1.94162 9.3212 1.48803 9.00694 1.30659L6.88569 0.0818893C6.57143 -0.0995479 6.17861 0.127249 6.17861 0.490123V1.24355L3.79422 1.24355C3.8758 1.28388 3.95685 1.32764 4.03701 1.37515C4.39137 1.58514 4.70799 1.8535 4.97658 2.18633H6.17861V2.93953C6.17861 3.3024 6.57143 3.5292 6.88569 3.34776L9.00694 2.12306Z"
        fill="#5546AD"
        fillOpacity="0.5"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.2289 2.18629C0.968555 2.18629 0.757507 1.97524 0.757507 1.7149C0.757507 1.45456 0.968555 1.24351 1.2289 1.24351L1.25667 1.24351C1.83754 1.24336 2.88939 1.2431 3.79669 1.78076C4.73183 2.33491 5.41508 3.39093 5.46807 5.25024H6.07899C6.50661 5.25024 6.77388 5.71315 6.56007 6.08349L5.48106 7.95239C5.26724 8.32273 4.73271 8.32272 4.5189 7.95239L3.43989 6.08349C3.22607 5.71315 3.49334 5.25024 3.92097 5.25024H4.52493C4.47412 3.6524 3.90482 2.94071 3.31606 2.59182C2.64707 2.19538 1.83273 2.18629 1.2289 2.18629Z"
        fill="#5546AD"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.24274 4.99998L0.757447 4.99998" stroke="#8572F7" strokeLinecap="round" />
    </svg>
  );
}

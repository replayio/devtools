import classNames from "classnames";
import React, { useState } from "react";

export interface AccordionItem {
  className?: string;
  component: React.ReactNode;
  header: string;
  onToggle?: (open: boolean) => void;
  collapsed?: boolean;
  button?: React.ReactNode;
}
export interface SectionPosition {
  top: number;
  height: number;
}
export type CollapsedState = boolean[];
export type CreasesState = number[];

const ACCORDION_HEIGHT = 600;
const MIN_HEIGHT = 150;
const HEADER_HEIGHT = 24 + 1;

const getSpaceBefore = (index: number, creases: CreasesState) => {
  return creases.slice(0, index).reduce((a, b) => a + b, 0) || 0;
};
const getSpaceAfter = (index: number, creases: CreasesState) => {
  return creases.slice(index + 1).reduce((a, b) => a + b, 0);
};

const getPosition = (creases: CreasesState, index: number) => {
  const top = getSpaceBefore(index, creases);
  const height = creases[index];

  return { top, height };
};

// This allows the selected (expanded) session to gobble up as much vertical space as
// it's allowed to. Right now this works under the assumption that when you expand a
// section, it should take up as much height as possible, and all other currently
// expanded sections will be resized and shrink to the minimum height.
// TODO: If a user resizes a section, we should shrink not to that minimum height, but to
// the most recent resized height instead.
const embiggenSection = (index: number, creases: CreasesState, collapsed: CollapsedState) => {
  let newCreases = [...creases];

  // Adjust the sections AFTER this index.
  newCreases = newCreases.map((c, i) => {
    if (i <= index) return c;
    const isCollapsed = collapsed[i];
    return isCollapsed ? HEADER_HEIGHT : MIN_HEIGHT;
  });

  // Adjust the sections BEFORE this index.
  newCreases = newCreases.map((c, i) => {
    if (i >= index) return c;
    const isCollapsed = collapsed[i];
    return isCollapsed ? HEADER_HEIGHT : MIN_HEIGHT;
  });

  // Now that sections before and after are properly positioned,
  // distribute the remaining space to the selected section.
  newCreases[index] =
    ACCORDION_HEIGHT - getSpaceBefore(index, newCreases) - getSpaceAfter(index, newCreases);

  return newCreases;
};

function Section({
  children,
  collapsed,
  index,
  position,
  toggleCollapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  index: number;
  position: SectionPosition;
  toggleCollapsed: (index: number) => void;
}) {
  return (
    <div className={classNames("overflow-hidden flex flex-col absolute w-full")} style={position}>
      <button
        className="font-bold flex space-x-2 bg-gray-200 w-full px-2"
        onClick={() => toggleCollapsed(index)}
      >
        <div className="font-mono">{collapsed ? `>` : `v`}</div>
        <div>{`Section ${index + 1} `}</div>
      </button>
      <div className="overflow-auto">{!collapsed && children}</div>
      <div className={classNames("border-b border-black")} />
    </div>
  );
}

// Yeah there are two collapsed arguments. Something something stale props. This shouldn't
// look like this but I'm hungry so I'll refactor it later.
function maybeRedistributeSpace(
  index: number,
  collapsed: CollapsedState,
  newCollapsed: CollapsedState,
  newCreases: CreasesState
) {
  let adjustedCreases = [...newCreases];
  const lastExpandedIndex = collapsed.lastIndexOf(false);
  const firstExpandedIndex = collapsed.indexOf(false);

  // Collapsing a section frees up vertical space in the accordion. This puts in
  // some logic to figure out which section should be free to take the new space.
  // The specific heuristics are lifted from VSCode's accordion.
  if (lastExpandedIndex !== index) {
    // If there's one (or many) expanded sections after the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very last expanded section.
    adjustedCreases = embiggenSection(lastExpandedIndex, newCreases, newCollapsed);
  } else if (firstExpandedIndex !== index) {
    // If there's one (or many) expanded sections before the just-collapsed section,
    // this attempts to preserve the height of expanded sections closest to the
    // just-collapsed section by only embiggening the very first expanded section.
    adjustedCreases = embiggenSection(firstExpandedIndex, newCreases, newCollapsed);
  }

  return adjustedCreases;
}

export default function Accordion({ items }: any) {
  // This is fine for prototyping but there's a cleaner way to do this.
  const [collapsed, setCollapsed] = useState<CollapsedState>(new Array(items.length).fill(true));
  const [creases, setCreases] = useState<CreasesState>(new Array(items.length).fill(HEADER_HEIGHT));

  const expandSection = (index: number, newCollapsed: CollapsedState) => {
    let newCreases = embiggenSection(index, creases, newCollapsed);
    setCreases(newCreases);
  };
  const collapseSection = (index: number, newCollapsed: CollapsedState) => {
    let newCreases = [...creases];
    newCreases[index] = HEADER_HEIGHT;
    newCreases = maybeRedistributeSpace(index, collapsed, newCollapsed, newCreases);

    setCreases(newCreases);
  };
  const toggleCollapsed = (index: number) => {
    const isCollapsed = collapsed[index];

    const newCollapsed = [...collapsed];
    newCollapsed[index] = !isCollapsed;
    setCollapsed(newCollapsed);

    if (isCollapsed) {
      expandSection(index, newCollapsed);
    } else {
      collapseSection(index, newCollapsed);
    }
  };

  return (
    <div className="h-full overflow-auto flex flex-col relative">
      {items.map((item: any, index: number) => (
        <Section
          key={item}
          index={index}
          collapsed={collapsed[index]}
          toggleCollapsed={toggleCollapsed}
          position={getPosition(creases, index)}
        >
          {item.component}
        </Section>
      ))}
    </div>
  );
}

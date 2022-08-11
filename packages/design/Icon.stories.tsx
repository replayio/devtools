import type { Meta } from "@storybook/react";
import { Icon } from "design";
import type { IconNames } from "icons";
import { iconMap } from "icons";
import { useState } from "react";

export default {
  title: "Components/Icon",
  component: Icon,
} as Meta;

export function BasicUsage() {
  const [filterValue, setFilterValue] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <input
        placeholder="Filter icons..."
        value={filterValue}
        onChange={event => setFilterValue(event.target.value)}
        style={{ padding: "0.25rem 0.5rem", border: "1px solid grey" }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, 10rem)",
        }}
      >
        {(Object.keys(iconMap) as IconNames[])
          .filter(name => name.toLowerCase().includes(filterValue.toLowerCase()))
          .map(name => (
            <IconSpecimen key={name} name={name} />
          ))}
      </div>
    </div>
  );
}

function IconSpecimen({ name }: { name: IconNames }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 0",
        gap: "1rem",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: copied ? "#bee8b8" : "white",
        transition: "background-color ease-out 120ms",
      }}
      onClick={() => {
        navigator.clipboard.writeText(`<Icon name="${name}" />`).then(() => {});
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 300);
      }}
    >
      <Icon name={name} />
      <span
        style={{ fontSize: "0.85rem", color: copied ? "black" : "var(--theme-text-color-alt)" }}
      >
        {copied ? "Copied" : name}
      </span>
    </div>
  );
}

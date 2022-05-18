import type { Meta } from "@storybook/react";
import * as icons from "icons";
import { useState } from "react";

export default {
  title: "Icons",
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
        {Object.entries(icons)
          .filter(([name]) => name.toLowerCase().includes(filterValue.toLowerCase()))
          .map(([name, IconElement]) => (
            <Icon key={name} name={name} icon={<IconElement />} />
          ))}
      </div>
    </div>
  );
}

function Icon({ name, icon }: { name: string; icon: React.ReactElement<any> }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        gap: "1rem",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: copied ? "#bee8b8" : "white",
        transition: "background-color ease-out 120ms",
      }}
      onClick={() => {
        navigator.clipboard.writeText(name).then(() => {});
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 300);
      }}
    >
      {icon}
      <span
        style={{ fontSize: "0.85rem", color: copied ? "black" : "var(--theme-text-color-alt)" }}
      >
        {copied ? "Copied" : name}
      </span>
    </div>
  );
}

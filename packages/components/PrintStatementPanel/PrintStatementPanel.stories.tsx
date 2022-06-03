import { Meta } from "@storybook/react";
import { PrintStatementPanel } from "components";

export default {
  title: "Components/PrintStatementPanel",
  component: PrintStatementPanel,
} as Meta;

export function BasicUsage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
      }}
    >
      <PrintStatementPanel />
    </div>
  );
}

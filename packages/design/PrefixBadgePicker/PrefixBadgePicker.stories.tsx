import { Meta } from "@storybook/react";
import { PrefixBadgePicker } from "design";

export default {
  title: "Components/PrefixBadgePicker",
  component: PrefixBadgePicker,
} as Meta;

export function BasicUsage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PrefixBadgePicker />
      <PrefixBadgePicker initialValue="unicorn" />
    </div>
  );
}

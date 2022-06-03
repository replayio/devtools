import { Meta } from "@storybook/react";
import { PrefixBadgePicker } from "components";

export default {
  title: "Components/PrefixBadgePicker",
  component: PrefixBadgePicker,
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
      <PrefixBadgePicker initialState="closed" />

      <PrefixBadgePicker initialState="opened" />
    </div>
  );
}

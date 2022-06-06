import { Meta } from "@storybook/react";
import { Column, PrefixBadgePicker } from "components";

export default {
  title: "Components/PrefixBadgePicker",
  component: PrefixBadgePicker,
} as Meta;

export function BasicUsage() {
  return (
    <>
      <Column gap={2} style={{ padding: "1rem" }}>
        <PrefixBadgePicker initialState="closed" />
        <PrefixBadgePicker initialState="opened" />
      </Column>
      <Column
        gap={2}
        className="theme-dark"
        style={{ padding: "1rem", backgroundColor: "#192230" }}
      >
        <PrefixBadgePicker initialState="closed" />
        <PrefixBadgePicker initialState="opened" />
      </Column>
    </>
  );
}

import { Meta } from "@storybook/react";
import { Column, PrefixBadgePicker } from "components";

export default {
  title: "Components/PrefixBadgePicker",
  component: PrefixBadgePicker,
} as Meta;

export function BasicUsage() {
  return (
    <>
      <Column gap={2} className="theme-light items-start p-1">
        <PrefixBadgePicker />
        <PrefixBadgePicker initialValue="unicorn" />
      </Column>
      <Column gap={2} className="theme-dark items-start p-1" style={{ backgroundColor: "#192230" }}>
        <PrefixBadgePicker />
        <PrefixBadgePicker initialValue="unicorn" />
      </Column>
    </>
  );
}

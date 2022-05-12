import { Meta } from "@storybook/react";
import { Button } from "components";
import React, { useState } from "react";

export default {
  title: "Components/Button",
  component: Button,
} as Meta;

export function BasicUsage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "start" }}>
      <h2>Default</h2>
      <Button label="Hello Button" />
      <h2>labelVisible=false</h2>
      <Button label="Add comment" labelVisible={false} iconStart="comment-plus" />
      <h2>labelVisible=hover</h2>
      <Button label="Add comment" labelVisible="hover" iconStart="comment-plus" />
      <h2>labelVisible=click</h2>
      <Button label="Add comment" labelVisible="click" iconStart="comment-plus" />
    </div>
  );
}

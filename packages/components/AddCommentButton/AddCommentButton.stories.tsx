import { Meta } from "@storybook/react";
import { AddCommentButton } from "components";

export default {
  title: "Components/AddCommentButton",
  component: AddCommentButton,
} as Meta;

export function BasicUsage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        width: 200,
        padding: "1rem",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2>Left Aligned</h2>
      <div style={{ display: "flex" }}>
        <AddCommentButton onClick={() => alert("Add comment")} />
      </div>
      <h2>Right Aligned</h2>
      <div style={{ display: "flex", justifyContent: "end" }}>
        <AddCommentButton onClick={() => alert("Add comment")} />
      </div>
    </div>
  );
}

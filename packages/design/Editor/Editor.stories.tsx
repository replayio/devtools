import { Meta } from "@storybook/react";
import { Editor } from "design";

export default {
  title: "Components/Editor",
  component: Editor,
} as Meta;

const initialCodeString = `
async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);
  const formData = Object.fromEntries(data.entries());
  const body = JSON.stringify(formData);
  const response = await fetch(form.action, {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    setHasError(true);
    throw new Error(errorMessage);
  }
}
`.trim();

export function BasicUsage() {
  return (
    <div>
      <Editor value={initialCodeString} />
    </div>
  );
}

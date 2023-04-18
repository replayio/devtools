export function formatTitle(title: string): string {
  if (title.includes("/")) {
    return title.split("/").pop()!;
  } else {
    return title;
  }
}

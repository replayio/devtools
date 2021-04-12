export function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

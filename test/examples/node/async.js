




function finished() {
  process.exit(0);
}
async function foo() {
  console.log("foo");
  bar();
  await baz(4);
  setTimeout(finished, 0);
}
function bar() {
  console.log("bar");
}
async function baz(n) {
  console.log("baz", n);
  if (n) {
    await new Promise(r => setTimeout(r, 0));
    await baz(n - 1);
  }
  return n;
}
foo();

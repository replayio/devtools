
function foo() {
  for (let i = 0; i < 3; i++) {
    bar(i);
  }
}

function bar(num) {
  console.log("HELLO", num, { num });
}

setTimeout(foo, 0);

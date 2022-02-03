setTimeout(foo, 0);
function foo() {
  const fooobj = { fooprop1: 0, fooprop2: 1 };
  console.log(bar());
}
function bar() {
  const barobj = {
    barprop1: 2,
    barprop2: 3,
    nested: {
      nestedprop1: 4,
    }
  };
  const bararr = [5, 6, barobj];
  console.log(barobj);
  update(barobj, bararr);
  console.log(barobj);
  setTimeout(recordingFinished, 0);
  return bararr;
}
function update(obj, arr) {
  obj.barprop1 = "updated";
  arr.push("new");
}
function recordingFinished() {
  console.log("ExampleFinished");
}
window.bar = bar;


function foo() {
  // Create various objects see doc_rr_objects.html in the devtools repo.
  var a = Array();
  var b = new Uint8Array(20);
  var c = new Set([{a:0},{b:1}]);
  var d = new Map([[{a:0},{b:1}]]);
  var e = new WeakSet();
  var f = new WeakMap();
  const keepalive = [];
  var g = { a:0 };
  for (let i = 0; i < 20; i++) {
    a.push(i);
    b[i] = i;
    c.add(i);
    d.set(i, i + 1);
    const k = { i };
    const v = { j: i + 1 };
    keepalive.push(k, v);
    e.add(k);
    f.set(k, v);
    g[`a${i}`] = i;
  }
  var h = /abc/gi;
  var i = new Date();
  var j = RangeError("foo");
  var l = bar;
  var m = [undefined, true, 3, null, "z", 40n];
  var n = new Proxy({ a: 0 }, {
    get(target, prop, receiver) {
      dump("Hello\n");
    }
  });
  var o = Symbol();
  var p = Symbol("symbol");
  var q = { [o]: 42, [p]: o };
  console.log(a);
  console.log(b);
  console.log(c);
  console.log(d);
  console.log(e);
  console.log(f);
  console.log(g);
  console.log(h);
  console.log(i);
  console.log(j);
  console.log(l);
  console.log(m);
  console.log(n);
  console.log(o);
  console.log(p);
  console.log(q);
}
foo();

function bar(z) {
  console.log("bar", z);
}

function baz() {
  console.log("baz");
}

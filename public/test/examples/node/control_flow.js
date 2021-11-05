//<html lang="en" dir="ltr">
//<body>
//<div id="maindiv" style="padding-top:50px">Hello World!</div>
//</body>
//<script>
function trycatch() {
  try {
    throwError();
  } catch (e) {
    updateText("catch");
  }
  updateText("afterCatch");
  startNextCallback();
}

function tryfinally() {
  try {
    throwError();
  } finally {
    updateText("finally");
    startNextCallback();
  }
}

function generator() {
  for (const v of inner()) {
    updateText(`generated ${v}`);
  }

  function *inner() {
    for (const v of [1,2]) {
      updateText(`yield ${v}`);
      yield v;
    }
  }

  startNextCallback();
}

async function asyncer() {
  await timer();
  updateText("after timer 1");
  await timer();
  updateText("after timer 2");
  startNextCallback();
}

async function asyncerThrow() {
  await timer();
  updateText("after throw timer 1");
  try {
    await timerThrow();
  } catch (e) {
    updateText("after throw timer 2");
    startNextCallback();
    throw e;
  }
}

async function customIterator() {
  const obj = {
    *[Symbol.iterator]() {
      yield 1;
      yield 2;
      updateText("within iterator");
      yield 3;
    }
  };
  for (const a of obj) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  startNextCallback();
}

const callbacks = [
  trycatch,
  tryfinally,
  generator,
  asyncer,
  asyncerThrow,
  customIterator,
];

debugger;
startNextCallback();

// Helpers

function startNextCallback() {
  if (callbacks.length) {
    const callback = callbacks.shift();
    setTimeout(async () => {
      try { await callback() } catch (e) {}
    });
  } else {
    process.exit(0); // dump(`RecReplaySendAsyncMessage Example__Finished`);
  }
}

function updateText(text) {
  console.log(text);
}

function throwError() {
  throw new Error();
}

function timer() {
  return new Promise(resolve => {
    setTimeout(resolve);
  });
}

function timerThrow() {
  return new Promise((resolve, reject) => {
    setTimeout(reject);
  });
}
//</script>
//</html>

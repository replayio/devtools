
const { spawnSync, spawn } = require("child_process");

function foo(n) {
  const { stdout } = spawnSync("echo", [n.toString()]);
  console.log("sync", stdout.toString().trim());
}
for (let i = 0; i < 10; i++) {
  foo(i);
}

async function bar() {
  for (let i = 0; i < 10; i++) {
    const { stdout } = await spawnAsync("echo", [i.toString()]);
    console.log("async", stdout.toString().trim());
  }
}
bar();

async function spawnAsync(command, args, options) {
  const process = spawn(command, args, options);

  const parts = [];
  const promises = [];

  if (process.stdout) {
    process.stdout.on("data", buf => parts.push(buf));

    // Make sure stdout has been fully read before returning.
    const { resolve, promise } = defer();
    promises.push(promise);
    process.stdout.on("end", resolve);
  }

  const { resolve, reject, promise } = defer();

  // Make sure the process exits before returning.
  promises.push(promise);

  process.on("exit", code => {
    if (code) {
      reject(`Process exited abnormally ${command} ${args}`);
    } else {
      resolve();
    }
  });

  await Promise.all(promises);

  return { stdout: Buffer.concat(parts).toString() };
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

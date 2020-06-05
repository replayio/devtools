/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function makeInfallible(fn, thisv) {
  return (...args) => {
    try {
      fn.apply(thisv, args);
    } catch (e) {
      console.error(e);
    }
  };
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function throttle(callback, time) {
  let scheduled = false;
  return () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      callback();
    }, time);
  };
}

function clamp(value, min, max) {
  assert(min < max);
  return Math.max(min, Math.min(max, value));
}

function assert(v, msg = "Assertion failed!") {
  if (!v) {
    console.error(msg);
    throw new Error(msg);
  }
}

function binarySearch(start, end, callback) {
  while (start + 1 < end) {
    const mid = ((start + end) / 2) | 0;
    const rv = callback(mid);
    if (rv < 0) {
      end = mid;
    } else {
      start = mid;
    }
  }
  return start;
}

function NotAllowed() {
  console.error("Not allowed");
}

const DisallowEverythingProxyHandler = {
  getPrototypeOf() { NotAllowed(); },
  has() { NotAllowed(); },
  get(_, name) { NotAllowed(); },
  //set() { NotAllowed(); },
  apply() { NotAllowed(); },
  construct() { NotAllowed(); },
  getOwnPropertyDescriptor() { NotAllowed(); },
  ownKeys() { NotAllowed(); },
  isExtensible() { NotAllowed(); },
  setPrototypeOf() { NotAllowed(); },
  preventExtensions() { NotAllowed(); },
  defineProperty() { NotAllowed(); },
  deleteProperty() { NotAllowed(); },
};

const EventEmitter = {
  decorate(obj) {
    obj.eventListeners = new Map();

    obj.on = (name, handler) => {
      if (obj.eventListeners.has(name)) {
        obj.eventListeners.get(name).push(handler);
      } else {
        obj.eventListeners.set(name, [handler]);
      }
    };

    obj.off = (name, handler) => {
      obj.eventListeners.set(
        name,
        (obj.eventListeners.get(name) || []).filter(h => h != handler)
      );
    };

    obj.emit = (name, value) => {
      (obj.eventListeners.get(name) || []).forEach(handler => handler(value));
    };
  },
};

module.exports = {
  makeInfallible,
  defer,
  throttle,
  clamp,
  assert,
  binarySearch,
  DisallowEverythingProxyHandler,
  EventEmitter,
};

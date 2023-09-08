import { configureStore, createSlice } from "@reduxjs/toolkit";

export const counterSlice = createSlice({
  name: "counter",
  initialState: {
    value: 0,
  },
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

// this example contains some delays for now to work around RecordReplay/gecko-dev#349
function waitForTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const { increment, decrement, incrementByAmount } = counterSlice.actions;

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

const span = document.createElement("span");
document.querySelector("#app").appendChild(span);

store.subscribe(() => {
  const state = store.getState();
  span.innerHTML = state.counter.value;
});

async function update() {
  console.log("Initial state");

  store.dispatch(incrementByAmount(2));
  await waitForTime(2000);
  console.log("Incremented by 2");

  store.dispatch(decrement());
  await waitForTime(2000);
  console.log("Decremented");

  store.dispatch(decrement());
  await waitForTime(2000);
  console.log("Decremented");

  store.dispatch(increment());
  console.log("Incremented");

  console.log("ExampleFinished");
}

update();

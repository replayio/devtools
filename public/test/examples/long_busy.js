function reducer(state, action) {
  switch (action.type) {
    case "tick":
      return {
        ...state,
        ticks: state.ticks + 1,
        items: [action.item, ...state.items].slice(0, 20),
      };
    case "increment":
      return { ...state, clicks: state.clicks + 1 };
    default:
      return state;
  }
}
var state = { ticks: 0, clicks: 0, items: [] };
var listeners = [];
function dispatch(action) {
  state = reducer(state, action);
  listeners.forEach(listener => listener());
}
function subscribe(listener) {
  listeners.push(listener);
}
function render() {
  document.getElementById("summary").textContent = `Ticks: ${state.ticks}, clicks: ${state.clicks}`;
  var list = document.getElementById("items");
  list.innerHTML = "";
  state.items.forEach(item => {
    var li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}
subscribe(render);
function tick() {
  dispatch({ type: "tick", item: `Item ${state.ticks}` });
  if (state.ticks % 4 === 0) {
    console.log("Tick", state.ticks / 4);
  }
}
function handleIncrementClick() {
  dispatch({ type: "increment" });
  console.log("Clicked", state.clicks);
}
var intervalId = window.setInterval(tick, 250);
document.getElementById("increment").addEventListener("click", handleIncrementClick);
document.getElementById("finish").addEventListener("click", function handleFinishClick() {
  window.clearInterval(intervalId);
  console.log("ExampleFinished");
});

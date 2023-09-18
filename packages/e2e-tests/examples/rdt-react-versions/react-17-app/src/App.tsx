import React from "react";
import { useState } from "react";

export function App() {
  const [counter, setCounter] = useState(0);
  return <div>React 17 app (counter: {counter})</div>;
}

export default App;

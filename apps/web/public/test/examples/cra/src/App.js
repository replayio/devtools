import React, { useEffect } from "react";

// this example contains some delays for now to work around RecordReplay/gecko-dev#349
function waitForTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function App() {
  const [list, setList] = React.useState([]);

  useEffect(() => {
    async function update() {
      setList([{ key: "1", text: "Foo" }]);
      await waitForTime(2000);
      console.log("Initial list");

      setList([
        { key: "1", text: "Foo" },
        { key: "2", text: "Bar" },
      ]);
      await waitForTime(100);
      console.log("Added an entry");

      setList([{ key: "2", text: "Bar" }]);
      await waitForTime(100);
      console.log("Removed an entry");

      console.error(new Error("Baz"));

      // eslint-disable-next-line no-undef
      console.log("ExampleFinished");
    }
    update();
  }, []);

  return <List list={list} />;
}

function List({ list }) {
  return (
    <ul style={{ width: "100px" }}>
      {list.map(data => (
        <Item key={data.key} text={data.text} />
      ))}
    </ul>
  );
}

function Item({ text }) {
  return <li>{text}</li>;
}

export default App;

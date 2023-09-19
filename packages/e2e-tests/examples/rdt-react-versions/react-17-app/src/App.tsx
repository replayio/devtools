import { useEffect, useState } from "react";

// this example contains some delays for now to work around RecordReplay/gecko-dev#349
function waitForTime(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function throwError(version: string) {
  throw new Error(`[${version}] Baz`);
}

interface Item {
  key: string;
  text: string;
}

const version = "17.0.2";

function App() {
  const [list, setList] = useState<Item[]>([]);

  useEffect(() => {
    async function update() {
      setList([{ key: "1", text: "Foo" }]);
      await waitForTime(2000);
      console.log(`[${version}] Initial list`);

      setList([
        { key: "1", text: "Foo" },
        { key: "2", text: "Bar" },
      ]);
      await waitForTime(100);
      console.log(`[${version}] Added an entry`);

      setList([{ key: "2", text: "Bar" }]);
      await waitForTime(100);
      console.log(`[${version}] Removed an entry`);

      try {
        throwError(version);
      } catch (error) {
        console.error(error);
      }

      // eslint-disable-next-line no-undef
      console.log(`[${version}] ExampleFinished`);
    }
    update();
  }, []);

  return (
    <div>
      <h2>Version: {version}</h2>
      <List list={list} />
    </div>
  );
}

function List({ list }: { list: Item[] }) {
  return (
    <ul style={{ width: "100px" }}>
      {list.map(data => (
        <Item key={data.key} text={data.text} />
      ))}
    </ul>
  );
}

function Item({ text }: { text: string }) {
  return <li>{text}</li>;
}

export default App;

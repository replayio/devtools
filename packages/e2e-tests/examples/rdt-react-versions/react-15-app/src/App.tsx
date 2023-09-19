import React from "react";

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

interface AppState {
  list: Item[];
}

const version = "15.7.0";

class React15App extends React.Component<any, AppState> {
  state = {
    list: [],
  };

  componentDidMount = () => {
    const update = async () => {
      this.setState({ list: [{ key: "1", text: "Foo" }] });
      await waitForTime(2000);
      console.log(`[${version}] Initial list`);

      this.setState({
        list: [
          { key: "1", text: "Foo" },
          { key: "2", text: "Bar" },
        ],
      });
      await waitForTime(100);
      console.log(`[${version}] Added an entry`);

      this.setState({ list: [{ key: "2", text: "Bar" }] });
      await waitForTime(100);
      console.log(`[${version}] Removed an entry`);

      try {
        throwError(version);
      } catch (error) {
        console.error(error);
      }

      // eslint-disable-next-line no-undef
      console.log(`[${version}] ExampleFinished`);
    };
    update();
  };

  render() {
    const { list } = this.state;
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2>Version: {version}</h2>
        <React15List list={list} />
        <React15FizzBuzzCounterClass version={version} />
      </div>
    );
  }
}

function IsEven() {
  return <span>Even</span>;
}

function IsOdd() {
  return <span>Odd</span>;
}

function Fizz() {
  return <span>Fizz</span>;
}

function Buzz() {
  return <span>Buzz</span>;
}

function FizzBuzz() {
  return <span>FizzBuzz</span>;
}

function NoBuzz() {
  return <span>N/A</span>;
}

type FizzBuzzValue = "fizzbuzz" | "fizz" | "buzz" | "N/A";

function calculateFizzbuzz(n: number): FizzBuzzValue {
  if (n % 15 === 0) {
    return "fizzbuzz";
  } else if (n % 3 === 0) {
    return "fizz";
  } else if (n % 5 === 0) {
    return "buzz";
  }
  return "N/A";
}

const fizzBuzzComponents: Record<FizzBuzzValue, React.ComponentType> = {
  fizzbuzz: FizzBuzz,
  fizz: Fizz,
  buzz: Buzz,
  "N/A": NoBuzz,
};

interface FizzBuzzCounterProps {
  version: string;
}

interface FizzBuzzCounter {
  counter: number;
}

class React15FizzBuzzCounterClass extends React.Component<FizzBuzzCounterProps, FizzBuzzCounter> {
  state = {
    counter: 0,
  };

  componentDidMount() {
    const runCounter = async () => {
      for (let i = 0; i < 4; i++) {
        await waitForTime(500);
        this.setState(prevState => ({
          counter: prevState.counter + 1,
        }));
      }
    };

    runCounter();
  }

  render() {
    const { version } = this.props;
    const { counter } = this.state;

    const isEven = counter % 2 === 0;
    const fizzbuzzResult = calculateFizzbuzz(counter);
    const FizzBuzzComponent = fizzBuzzComponents[fizzbuzzResult];

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h4>FizzBuzz (v{version})</h4>
        <div>Counter: {counter}</div>
        <div>Even/Odd: {isEven ? <IsEven /> : <IsOdd />}</div>
        <div>
          FizzBuzz: <FizzBuzzComponent />
        </div>
      </div>
    );
  }
}

function React15List({ list }: { list: Item[] }) {
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

export default React15App;

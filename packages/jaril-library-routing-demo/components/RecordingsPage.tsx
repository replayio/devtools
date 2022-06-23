import { ListItem } from "./ListItem";

const length = 50;

export function RecordingsPage() {
  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-rose-200">
      {new Array(length).fill("").map((_, i) => (
        <div className="p-4 bg-rose-300" key={i}>
          Recording {i}
        </div>
      ))}
    </div>
  );
}

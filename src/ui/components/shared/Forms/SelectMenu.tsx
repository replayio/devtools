import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import classnames from "classnames";

interface MenuOption {
  name: string;
  id: string | null;
}

function Option({ name, id }: { name: string; id: string | null }) {
  return (
    <Listbox.Option
      key={id}
      className={({ active }) =>
        classnames(
          active ? "text-white bg-blue-600" : "text-gray-900",
          "cursor-default select-none relative py-2 pl-3 pr-9"
        )
      }
      value={id}
    >
      {({ selected, active }) => (
        <>
          <span
            className={classnames(selected ? "font-semibold" : "font-normal", "block truncate")}
          >
            {name}
          </span>
          {selected ? (
            <span
              className={classnames(
                active ? "text-white" : "text-blue-600",
                "absolute inset-y-0 right-0 flex items-center pr-4"
              )}
            >
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
        </>
      )}
    </Listbox.Option>
  );
}

export default function SelectMenu({
  selected,
  setSelected,
  options,
  label,
}: {
  selected: string | null;
  setSelected: (value: string | null) => void;
  options: MenuOption[];
  label?: string;
}) {
  const selectedName = options.find(option => option.id === selected)!.name;

  return (
    <div>
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            {label ? (
              <Listbox.Label className="block text-md font-medium text-gray-700">
                label
              </Listbox.Label>
            ) : null}
            <div className="mt-1 relative z-10">
              <Listbox.Button className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg">
                <span className="block truncate">{selectedName}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  static
                  className="absolute mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none text-lg"
                >
                  {options.map(({ name, id }) => (
                    <Option name={name} id={id} key={id} />
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
}

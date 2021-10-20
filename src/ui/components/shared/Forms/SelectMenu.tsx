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
          active ? "text-white bg-primaryAccent" : "",
          "cursor-default select-none relative py-1.5 pl-2.5 pr-7"
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
                active ? "text-white" : "text-primaryAccent",
                "absolute inset-y-0 right-0 flex items-center pr-3"
              )}
            >
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
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
  className,
}: {
  selected: string | null;
  setSelected: (value: string | null) => void;
  options: MenuOption[];
  className?: string;
  label?: string;
}) {
  const selectedName = options.find(option => option.id === selected)!.name;

  return (
    <div>
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            {label ? <Listbox.Label className="block font-medium ">label</Listbox.Label> : null}
            <div className={`relative z-10 ${className}`}>
              <Listbox.Button className="bg-white relative w-full border border-textFieldBorder rounded-md shadow-sm pl-2.5 pr-8 py-1.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primaryAccent focus:border-primaryAccentHover">
                <span className="block truncate">{selectedName}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                  <SelectorIcon className="h-4 w-4 text-textFieldBorder" aria-hidden="true" />
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
                  className="absolute mt-1 w-full bg-white shadow-lg max-h-48 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
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

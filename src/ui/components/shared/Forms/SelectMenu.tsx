import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import classnames from "classnames";
import React, { Fragment } from "react";

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
          active ? "bg-primaryAccent text-white" : "",
          "relative cursor-default select-none py-1.5 pl-2.5 pr-7"
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
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          {label ? <Listbox.Label className="block font-medium">label</Listbox.Label> : null}
          <div className={`relative z-10 ${className || ""}`}>
            <Listbox.Button className="relative w-full cursor-default rounded-md border border-textFieldBorder bg-chrome py-1.5 pl-2.5 pr-8 text-left shadow-sm focus:border-primaryAccentHover focus:outline-none focus:ring-1 focus:ring-primaryAccent">
              <span className="block truncate">{selectedName}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
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
                className="absolute mt-1 max-h-48 w-full overflow-auto rounded-md bg-chrome py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
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
  );
}

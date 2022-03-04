/* This example requires Tailwind CSS v2.0+ */
import React, { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import classNames from "classnames";
import MaterialIcon from "../shared/MaterialIcon";
import { trackEvent } from "ui/utils/telemetry";
import { ToolboxLayout } from "ui/state/layout";

function ToolboxOptions({
  showVideoPanel,
  setShowVideoPanel,
  toolboxLayout,
  setToolboxLayout,
}: PropsFromRedux) {
  function Item({ label, value }: { label: string; value: ToolboxLayout }) {
    const active = toolboxLayout == value;

    return (
      <a
        href="#"
        className={classNames(
          "block px-4 py-2",
          active
            ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-gray-50"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
        onClick={() => {
          setToolboxLayout(value);
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Menu as="div" className="secondary-toolbox-options relative z-20 inline-block text-left">
      <div>
        <Menu.Button className="layoutbutton toolbox-options flex items-center text-iconColor hover:text-gray-600">
          <MaterialIcon
            outlined
            className="material-icons-outlined text-xl leading-none text-iconColor hover:text-primaryAccentHover"
          >
            view_compact
          </MaterialIcon>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-menuBgcolor text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? "bg-menuHoverBgcolor text-menuHoverColor" : "text-menuColor",
                    "block px-4 py-2"
                  )}
                  onClick={() => {
                    trackEvent("toolbox.secondary.video_toggle");
                    setShowVideoPanel(!showVideoPanel);
                  }}
                >
                  {`${showVideoPanel ? "Hide" : "Show"} Video`}
                </a>
              )}
            </Menu.Item>
            {showVideoPanel ? (
              <>
                <Menu.Item>
                  {({ active }) => <Item label="Standard DevTools Layout" value="ide" />}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => <Item label="Dock DevTools to Left" value="left" />}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => <Item label="Dock DevTools to Bottom" value="bottom" />}
                </Menu.Item>
              </>
            ) : (
              <>
                <Menu.Item>
                  {({ active }) => <Item label="Split DevTools Layout" value="ide" />}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => <Item label="Unified DevTools Layout" value="left" />}
                </Menu.Item>
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

const connector = connect(
  (state: UIState) => ({
    showVideoPanel: selectors.getShowVideoPanel(state),
    toolboxLayout: selectors.getToolboxLayout(state),
  }),
  {
    setShowVideoPanel: actions.setShowVideoPanel,
    setToolboxLayout: actions.setToolboxLayout,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ToolboxOptions);

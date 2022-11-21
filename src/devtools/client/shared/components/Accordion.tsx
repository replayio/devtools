/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";

export interface AccordionItem {
  buttons?: React.ReactNode[];
  className?: string;
  component: React.ComponentType<any>;
  componentProps: Record<string, unknown>;
  contentClassName?: string;
  header: string;
  id: string;
  onToggle: (opened: boolean) => void;
  opened: boolean;
}

interface AccordionProps {
  style?: React.CSSProperties;
  items: AccordionItem[];
}

interface AccordionState {
  opened: Record<string, boolean>;
  everOpened: Record<string, boolean>;
}

class Accordion extends React.Component<AccordionProps, AccordionState> {
  /**
   * Add initial data to the state.opened map, and inject new data
   * when receiving updated props.
   */
  static getDerivedStateFromProps(props: AccordionProps, state: AccordionState) {
    const newItems = props.items.filter(({ id }) => typeof state.opened[id] !== "boolean");

    if (newItems.length) {
      const everOpened = { ...state.everOpened };
      const opened = { ...state.opened };
      for (const item of newItems) {
        everOpened[item.id] = item.opened;
        opened[item.id] = item.opened;
      }
      return { everOpened, opened };
    }

    return null;
  }

  state: AccordionState = {
    opened: {},
    everOpened: {},
  };

  /**
   * @param {Event} event Click event.
   */
  onHeaderClick = (event: React.MouseEvent) => {
    event.preventDefault();
    // In the Browser Toolbox's Inspector/Layout view, handleHeaderClick is
    // called twice unless we call stopPropagation, making the accordion item
    // open-and-close or close-and-open
    event.stopPropagation();
    this.toggleItem(event.currentTarget.parentElement!.id);
  };

  /**
   * @param {Event} event Keyboard event.
   * @param {Object} item The item to be collapsed/expanded.
   */
  onHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      this.toggleItem(event.currentTarget.parentElement!.id);
    }
  };

  /**
   * Expand or collapse an accordion list item.
   * @param  {String} id Id of the item to be collapsed or expanded.
   */
  toggleItem(id: string) {
    const item = this.props.items.find((x: AccordionItem) => x.id === id);
    const opened = !this.state.opened[id];
    // We could have no item if props just changed
    if (!item) {
      return;
    }

    this.setState({
      everOpened: {
        ...this.state.everOpened,
        [id]: true,
      },
      opened: {
        ...this.state.opened,
        [id]: opened,
      },
    });

    if (typeof item.onToggle === "function") {
      item.onToggle(opened);
    }
  }

  renderItem(item: AccordionItem) {
    const {
      buttons,
      className = "",
      component: ItemComponent,
      componentProps = {},
      contentClassName = "",
      header,
      id,
    } = item;
    const headerId = `${id}-header`;
    const opened = this.state.opened[id];
    let itemContent;

    // Only render content if the accordion item is open or has been opened once
    // before. This saves us rendering complex components when users are keeping
    // them closed (e.g. in Inspector/Layout) or may not open them at all.
    if (this.state.everOpened[id]) {
      if (typeof ItemComponent === "function") {
        itemContent = <ItemComponent {...componentProps} />;
      } else if (typeof ItemComponent === "object") {
        itemContent = ItemComponent;
      }
    }

    return (
      <li
        key={id}
        id={id}
        className={`accordion-item ${className}`.trim()}
        aria-labelledby={headerId}
      >
        <h2
          id={headerId}
          className="accordion-header"
          tabIndex={0}
          aria-expanded={opened}
          // If the header contains buttons, make sure the heading name only
          // contains the "header" text and not the button text
          aria-label={header}
          onKeyDown={this.onHeaderKeyDown}
          onClick={this.onHeaderClick}
        >
          <span className={`theme-twisty${opened ? " open" : ""}`} role="presentation" />
          <span className="accordion-header-label">{header}</span>
          {buttons && (
            <span className="accordion-header-buttons" role="presentation">
              {buttons}
            </span>
          )}
        </h2>
        <div
          className={`accordion-content ${contentClassName}`.trim()}
          hidden={!opened}
          role="presentation"
        >
          {itemContent}
        </div>
      </li>
    );
  }

  render() {
    return (
      <ul className="accordion" style={this.props.style} tabIndex={-1}>
        {this.props.items.map((item: AccordionItem) => this.renderItem(item))}
      </ul>
    );
  }
}

export default Accordion;

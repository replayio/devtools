import React from "react";

import { Story, Meta } from "@storybook/react";

import Accordion, { AccordionItem } from "ui/components/Accordion";

const lorem = [
  "Sed ut perspiciatis",
  "unde omnis iste",
  "natus error si",
  "voluptatem accusantium doloremqu",
  "laudantium, tota",
  "rem aperiam",
  "eaque ipsa qua",
  "ab illo inventor",
  "veritatis et quas",
  "architecto beatae vita",
  "dicta sunt explicab",
  "Nemo enim ipsa",
  "voluptatem quia volupta",
  "sit aspernatur au",
  "Sed ut perspiciati",
  "unde omnis iste",
  "natus error si",
  "voluptatem accusantium doloremqu",
  "laudantium, tota",
  "rem aperiam",
  "eaque ipsa qua",
  "ab illo inventor",
  "veritatis et quas",
  "architecto beatae vita",
  "dicta sunt explicab",
  "Nemo enim ipsa",
  "voluptatem quia volupta",
  "sit aspernatur au",
  "Sed ut perspiciati",
  "unde omnis iste",
  "natus error si",
  "voluptatem accusantium doloremqu",
  "laudantium, tota",
  "rem aperiam",
  "eaque ipsa qua",
  "ab illo inventor",
  "veritatis et quas",
  "architecto beatae vita",
  "dicta sunt explicab",
  "Nemo enim ipsa",
  "voluptatem quia volupta",
  "sit aspernatur au",
  "Sed ut perspiciati",
  "unde omnis iste",
  "natus error si",
  "voluptatem accusantium doloremqu",
  "laudantium, tota",
  "rem aperiam",
  "eaque ipsa qua",
  "ab illo inventor",
  "veritatis et quas",
  "architecto beatae vita",
  "dicta sunt explicab",
  "Nemo enim ipsa",
  "voluptatem quia volupta",
  "sit aspernatur au",
];

export default {
  title: "Utilities/Accordion",
  component: Accordion,
} as Meta;

const Template: Story<{ items: Partial<AccordionItem & { size: number }>[] }> = args => {
  let items = args.items?.map((item, i) => {
    return {
      header: `Section ${i + 1}`,
      component: (
        <ul>
          {lorem.slice(item.size).map(sentence => (
            <li className="px-4">{sentence}</li>
          ))}
        </ul>
      ),
      ...item,
    };
  });
  return (
    <div
      style={{
        maxWidth: "500px",
        height: "600px",
        borderRadius: "8px",
        boxShadow:
          "0.2px 0px 2.2px rgba(0, 0, 0, 0.02), 0.5px 0px 5.3px rgba(0, 0, 0, 0.028), 0.9px 0px 10px rgba(0, 0, 0, 0.035), 1.6px 0px 17.9px rgba(0, 0, 0, 0.042), 2.9px 0px 33.4px rgba(0, 0, 0, 0.05), 7px 0px 80px rgba(0, 0, 0, 0.07)",
      }}
    >
      <Accordion items={items} />
    </div>
  );
};

export const OverflowingAllOpen = Template.bind({});
OverflowingAllOpen.args = {
  items: [{ size: 10 }, { size: 50 }, { size: 20 }],
};

export const UnderflowingSomeClosed = Template.bind({});
UnderflowingSomeClosed.args = {
  items: [{ size: 10 }, { size: 50, collapsed: true }, { size: 20, collapsed: true }],
};

export const OverflowingSomeClosed = Template.bind({});
OverflowingSomeClosed.args = {
  items: [{ size: 10 }, { size: 50, collapsed: true }, { size: 20 }],
};

export const VeryDifferentLengths = Template.bind({});
VeryDifferentLengths.args = {
  items: [{ size: 10 }, { size: 40 }],
};

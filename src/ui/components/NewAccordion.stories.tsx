import { Accordion, AccordionItem, AccordionPane } from "@recordreplay/accordion";
import { Story, Meta } from "@storybook/react";
import React, { useState } from "react";

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
  "Sed ut perspiciati1",
  "unde omnis iste1",
  "natus error si1",
  "voluptatem accusantium doloremqu1",
  "laudantium, tota1",
  "rem aperiam1",
  "eaque ipsa quaasd",
  "ab illo inventorasd",
  "veritatis et quasqw",
  "architecto beatae avita",
  "dicta sunt explicafb",
  "Nemo enim ipzsa",
  "voluptatem qzuia volupta",
  "sit aspernaturx au",
  "Sed ut perspicisati",
  "unde omnis iswte",
  "natus error ssi",
  "voluptatem acwcusantium doloremqu",
  "laudantium, gtota",
  "rem aperiamy",
  "eaque ipsa qewua",
  "ab illo inventasor",
  "veritatis et quaqs",
  "architecto beataefh vita",
  "dicta sunt explicaerthb",
  "Nemo enim ipsewa",
  "voluptatem quiawqr volupta",
  "sit aspernatur auqwr",
  "Sed ut perspiciati5trjh",
  "unde omnis isteweqr",
  "natus error sqwrei",
  "voluptatem accusantium doloremquqweqwe",
  "laudantium, totaqwe",
  "rem aperiamqwe",
  "eaque ipsa quaqwrweg",
  "ab illo inventoqwr",
  "veritatis et quasasd",
  "architecto beatae viasdta",
  "dicta sunt explicabasd1",
  "Nemo enim ipsaasdcv",
  "voluptatem quia volasdupta",
  "sit aspernatur aukuy",
];

export default {
  component: Accordion,
  title: "Utilities/NewAccordion",
} as Meta;

function MockAccordionContent({ size }: { size: number }) {
  return (
    <ul>
      {lorem.slice(0, size).map(sentence => (
        <li className="px-4" key={sentence}>
          {sentence}
        </li>
      ))}
    </ul>
  );
}

const Template: Story<{ items: Partial<AccordionItem & { size: number }>[] }> = args => {
  const initialExpandedState = args.items.map(i => i.expanded);
  const [expandedState, setExpandedState] = useState(initialExpandedState);

  const toggleExpandedStateForIndex = (index: number) => {
    const newState = [...expandedState];
    const newExpanded = !expandedState[index];
    newState[index] = newExpanded;

    setExpandedState(newState);
  };

  const panes = args.items.map(({ size }, i) => {
    return (
      <AccordionPane
        key={i}
        header={`Section ${i + 1}`}
        onToggle={() => toggleExpandedStateForIndex(i)}
        expanded={expandedState[i]}
      >
        <MockAccordionContent size={size!} key={i} />
      </AccordionPane>
    );
  });

  return (
    <div
      style={{
        borderRadius: "8px",
        boxShadow:
          "0.2px 0px 2.2px rgba(0, 0, 0, 0.02), 0.5px 0px 5.3px rgba(0, 0, 0, 0.028), 0.9px 0px 10px rgba(0, 0, 0, 0.035), 1.6px 0px 17.9px rgba(0, 0, 0, 0.042), 2.9px 0px 33.4px rgba(0, 0, 0, 0.05), 7px 0px 80px rgba(0, 0, 0, 0.07)",
        height: "600px",
        maxWidth: "500px",
        overflow: "hidden",
        resize: "vertical",
      }}
    >
      <Accordion>{panes}</Accordion>
    </div>
  );
};

export const UnderOver = Template.bind({});
UnderOver.args = {
  items: [
    { expanded: false, size: 10 },
    { expanded: false, size: 50 },
  ],
};

export const OverOver = Template.bind({});
OverOver.args = {
  items: [
    { expanded: false, size: 25 },
    { expanded: false, size: 50 },
  ],
};

export const OverOverOver = Template.bind({});
OverOverOver.args = {
  items: [
    { expanded: false, size: 25 },
    { expanded: false, size: 50 },
    { expanded: false, size: 50 },
  ],
};

export const OverOverOverOver = Template.bind({});
OverOverOverOver.args = {
  items: [
    { size: 25 },
    { expanded: false, size: 50 },
    { expanded: false, size: 50 },
    { expanded: false, size: 50 },
  ],
};

export const OverExpandedOver = Template.bind({});
OverExpandedOver.args = {
  items: [
    { expanded: true, size: 10 },
    { expanded: false, size: 50 },
  ],
};

export const OverOverOverExpanded = Template.bind({});
OverOverOverExpanded.args = {
  items: [
    { expanded: false, size: 25 },
    { expanded: false, size: 50 },
    { expanded: true, size: 50 },
  ],
};

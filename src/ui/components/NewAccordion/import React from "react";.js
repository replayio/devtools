import React from "react";

function Accordion() {
  return null;
}

function MyAccordion() {
  return (
    <Accordion>
      <AccordionPane>
        <AccordionPaneHeader>
          <MyHeaderComponent />
        </AccordionPaneHeader>
        <AccordionPaneContent>
          <MyPaneContent />
        </AccordionPaneContent>
      </AccordionPane>
    </Accordion>
  );
}

function MyAccordion() {
  return (
    <Accordion>
      <AccordionPane>
        <AccordionPaneHeader label="My Header" decorators={<DecoratorComponent />} />
        <AccordionPaneContent />
      </AccordionPane>
    </Accordion>
  );
}

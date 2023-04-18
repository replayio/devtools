import { TestItem } from "shared/graphql/types";
import { TestCaseSectionRow } from "ui/components/TestSuite/views/TestItem/TestCaseSectionRow";

import { ProcessedTestMetadata, ProcessedTestStep } from "../../types";
import styles from "./TestCaseSection.module.css";

export default function TestCaseSection({
  selectedTestStep,
  selectTestStep,
  testItem,
  testItemStartTime,
  testMetadata,
  testSteps,
  title,
}: {
  selectedTestStep: ProcessedTestStep | null;
  selectTestStep: (testStep: ProcessedTestStep) => void;
  testItem: TestItem;
  testItemStartTime: number;
  testMetadata: ProcessedTestMetadata;
  testSteps: ProcessedTestStep[];
  title: string;
}) {
  if (testSteps.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.Title}>{title}</div>
      {testSteps.map((testStep, index) => (
        <TestCaseSectionRow
          key={index}
          selectedTestStep={selectedTestStep}
          selectTestStep={selectTestStep}
          testItem={testItem}
          testItemStartTime={testItemStartTime}
          testMetadata={testMetadata}
          testStep={testStep}
        />
      ))}
    </>
  );
}
